import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Template, TemplateDocument } from './schemas/template.schema';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(Template.name) private templateModel: Model<TemplateDocument>,
  ) {}

  // Escape regex special characters in user input to avoid Mongo regex parse errors
  private escapeRegex(input: string) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async create(dto: CreateTemplateDto, authorId: string) {
    const visibility = dto.visibility || 'private';

    const doc = await this.templateModel.create({
      title: dto.title,
      description: dto.description,
      code: dto.code,
      language: dto.language,
      visibility,
      author: new Types.ObjectId(authorId),
    });
    return doc;
  }

  async findAll(params: {
    q?: string;
    sort?: 'latest' | 'likes';
    page?: number;
    limit?: number;
    authorId?: string; // filter by author
    scope?: 'public' | 'mine' | 'shared';
    currentUserId?: string;
  }) {
    const { q, sort = 'latest', page = 1, limit = 20, authorId, scope, currentUserId } = params;

    // Text/search filter
    const baseFilter: any = {};
    const qTrimmed = q?.trim();
    if (qTrimmed) {
      const safe = this.escapeRegex(qTrimmed);
      baseFilter.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
        { code: { $regex: safe, $options: 'i' } },
      ];
    }
    if (authorId) {
      baseFilter.author = new Types.ObjectId(authorId);
    }

    // ACL filter (public or mine)
    const me = currentUserId ? new Types.ObjectId(currentUserId) : null;
    let aclFilter: any;
    if (!me) {
      // Treat docs without visibility as public (migration-friendly)
      aclFilter = { $or: [ { visibility: 'public' }, { visibility: { $exists: false } } ] };
    } else if (scope === 'public') {
      aclFilter = { $or: [ { visibility: 'public' }, { visibility: { $exists: false } } ] };
    } else if (scope === 'mine') {
      aclFilter = { author: me };
    } else {
      // default: public OR mine
      aclFilter = {
        $or: [
          { visibility: 'public' },
          { visibility: { $exists: false } },
          { author: me },
        ],
      };
    }

    const filter: any = { $and: [baseFilter, aclFilter].filter(Boolean) };

    const sortObj =
      sort === 'likes'
        ? { likedByCount: -1, createdAt: -1 }
        : { createdAt: -1 };

    // Use aggregation to compute likedBy count for sorting by likes
    const pipeline: any[] = [
      { $match: filter },
      {
        $addFields: {
          likedByCount: { $size: { $ifNull: ['$likedBy', []] } },
        },
      },
      { $sort: sortObj },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          title: 1,
          description: 1,
          code: 1,
          language: 1,
          author: 1,
          createdAt: 1,
          updatedAt: 1,
          likedBy: 1,
          likedByCount: 1,
        },
      },
    ];

    const [items, totalDocs] = await Promise.all([
      this.templateModel.aggregate(pipeline),
      this.templateModel.countDocuments(filter),
    ]);

    return {
      items,
      total: totalDocs,
      page,
      limit,
      totalPages: Math.ceil(totalDocs / limit),
    };
  }

  async findById(id: string, currentUserId?: string) {
    const doc = await this.templateModel.findById(id);
    if (!doc) throw new NotFoundException('Template not found');
    // ACL check
    const me = currentUserId ? new Types.ObjectId(currentUserId) : null;
    const isPublic = (doc as any).visibility === 'public' || (doc as any).visibility === undefined;
    const isAuthor = me && doc.author?.equals(me);
    if (!isPublic && !isAuthor) {
      throw new NotFoundException('Template not found');
    }
    return doc;
  }

  async toggleLike(id: string, userId: string) {
    const _id = new Types.ObjectId(id);
    const uid = new Types.ObjectId(userId);

    const doc = await this.templateModel.findById(_id);
    if (!doc) throw new NotFoundException('Template not found');

    const already = doc.likedBy?.some((x) => x.equals(uid));
    if (already) {
      doc.likedBy = (doc.likedBy || []).filter((x) => !x.equals(uid));
    } else {
      doc.likedBy = [...(doc.likedBy || []), uid];
    }
    await doc.save();
    return { liked: !already, likes: doc.likedBy.length };
  }

  async update(id: string, dto: UpdateTemplateDto, userId: string) {
    const _id = new Types.ObjectId(id);
    const me = new Types.ObjectId(userId);

    const doc = await this.templateModel.findById(_id);
    if (!doc || !doc.author?.equals(me)) {
      throw new NotFoundException('Template not found');
    }

    if (dto.title !== undefined) doc.title = dto.title;
    if (dto.description !== undefined) doc.description = dto.description;
    if (dto.code !== undefined) doc.code = dto.code;
    if (dto.language !== undefined) doc.language = dto.language;

    if (dto.visibility !== undefined) {
      doc.visibility = dto.visibility as any;
    }

    await doc.save();
    return doc;
  }

  async remove(id: string, userId: string) {
    const _id = new Types.ObjectId(id);
    const me = new Types.ObjectId(userId);
    const doc = await this.templateModel.findById(_id);
    if (!doc || !doc.author?.equals(me)) {
      throw new NotFoundException('Template not found');
    }
    await this.templateModel.deleteOne({ _id });
    return { deleted: true };
  }

  // sharing removed
}
