import { AppError, ErrorFactory } from '../../utils/errors';
import { VideoNote, IVideoNote } from '../../models/extended/VideoNote';
import { Lesson } from '../../models/core';
import mongoose from 'mongoose';

export interface CreateNoteData {
  timestamp: number; // seconds in video
  content: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface UpdateNoteData {
  content?: string;
  tags?: string[];
  isPublic?: boolean;
}

export class VideoNoteService {
  /**
   * Create a new video note
   */
  static async createNote(
    lessonId: string,
    studentId: string,
    data: CreateNoteData
  ): Promise<IVideoNote> {
    try {
      // Validate lesson exists
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        throw ErrorFactory.notFound('Lesson not found');
      }

      // Validate timestamp is not negative
      if (data.timestamp < 0) {
        throw ErrorFactory.validation('Timestamp cannot be negative');
      }

      // Create note
      const note = new VideoNote({
        lessonId: new mongoose.Types.ObjectId(lessonId),
        studentId: new mongoose.Types.ObjectId(studentId),
        timestamp: data.timestamp,
        content: data.content.trim(),
        tags: data.tags || [],
        isPublic: data.isPublic || false,
      });

      await note.save();
      return note.populate('studentId', 'name email avatar');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.database('Failed to create note');
    }
  }

  /**
   * Get all notes for a lesson (student's own + public notes)
   */
  static async getNotes(
    lessonId: string,
    studentId: string
  ): Promise<IVideoNote[]> {
    try {
      return await VideoNote.find({
        lessonId: new mongoose.Types.ObjectId(lessonId),
        $or: [
          { studentId: new mongoose.Types.ObjectId(studentId) },
          { isPublic: true },
        ],
      })
        .populate('studentId', 'name email avatar')
        .sort({ timestamp: 1, createdAt: -1 });
    } catch (error) {
      throw ErrorFactory.database('Failed to get notes');
    }
  }

  /**
   * Get only public notes (for classmates)
   */
  static async getPublicNotes(lessonId: string): Promise<IVideoNote[]> {
    try {
      return await VideoNote.find({
        lessonId: new mongoose.Types.ObjectId(lessonId),
        isPublic: true,
      })
        .populate('studentId', 'name email avatar')
        .sort({ timestamp: 1, createdAt: -1 });
    } catch (error) {
      throw ErrorFactory.database('Failed to get public notes');
    }
  }

  /**
   * Get student's own notes
   */
  static async getStudentNotes(
    lessonId: string,
    studentId: string
  ): Promise<IVideoNote[]> {
    try {
      return await VideoNote.find({
        lessonId: new mongoose.Types.ObjectId(lessonId),
        studentId: new mongoose.Types.ObjectId(studentId),
      })
        .sort({ timestamp: 1, createdAt: -1 });
    } catch (error) {
      throw ErrorFactory.database('Failed to get student notes');
    }
  }

  /**
   * Update a note
   */
  static async updateNote(
    noteId: string,
    studentId: string,
    data: UpdateNoteData
  ): Promise<IVideoNote> {
    try {
      const note = await VideoNote.findById(noteId);
      if (!note) {
        throw ErrorFactory.notFound('Note not found');
      }

      // Check ownership
      if (note.studentId.toString() !== studentId) {
        throw ErrorFactory.authorization('You can only update your own notes');
      }

      // Update fields
      if (data.content !== undefined) {
        note.content = data.content.trim();
      }
      if (data.tags !== undefined) {
        note.tags = data.tags;
      }
      if (data.isPublic !== undefined) {
        note.isPublic = data.isPublic;
      }

      await note.save();
      return note.populate('studentId', 'name email avatar');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.database('Failed to update note');
    }
  }

  /**
   * Delete a note
   */
  static async deleteNote(noteId: string, studentId: string): Promise<void> {
    try {
      const note = await VideoNote.findById(noteId);
      if (!note) {
        throw ErrorFactory.notFound('Note not found');
      }

      // Check ownership
      if (note.studentId.toString() !== studentId) {
        throw ErrorFactory.authorization('You can only delete your own notes');
      }

      await VideoNote.deleteOne({ _id: noteId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.database('Failed to delete note');
    }
  }

  /**
   * Search notes by content or tags
   */
  static async searchNotes(
    lessonId: string,
    studentId: string,
    query: string
  ): Promise<IVideoNote[]> {
    try {
      const searchRegex = new RegExp(query, 'i');
      return await VideoNote.find({
        lessonId: new mongoose.Types.ObjectId(lessonId),
        $and: [
          {
            $or: [
              { studentId: new mongoose.Types.ObjectId(studentId) },
              { isPublic: true },
            ],
          },
          {
            $or: [
              { content: searchRegex },
              { tags: { $in: [searchRegex] } },
            ],
          },
        ],
      })
        .populate('studentId', 'name email avatar')
        .sort({ timestamp: 1 });
    } catch (error) {
      throw ErrorFactory.database('Failed to search notes');
    }
  }

  /**
   * Export notes to text format
   */
  static async exportNotesToText(
    lessonId: string,
    studentId: string
  ): Promise<string> {
    try {
      const notes = await this.getStudentNotes(lessonId, studentId);
      const lesson = await Lesson.findById(lessonId);

      let text = `Video Notes: ${lesson?.title || 'Unknown Lesson'}\n`;
      text += `Exported on: ${new Date().toLocaleString()}\n\n`;
      text += '='.repeat(50) + '\n\n';

      notes.forEach((note, index) => {
        const minutes = Math.floor(note.timestamp / 60);
        const seconds = Math.floor(note.timestamp % 60);
        text += `[${index + 1}] ${minutes}:${seconds.toString().padStart(2, '0')}\n`;
        text += `${note.content}\n`;
        if (note.tags && note.tags.length > 0) {
          text += `Tags: ${note.tags.join(', ')}\n`;
        }
        text += '\n' + '-'.repeat(50) + '\n\n';
      });

      return text;
    } catch (error) {
      throw ErrorFactory.database('Failed to export notes');
    }
  }
}
