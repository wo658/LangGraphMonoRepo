import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Template, TemplateDocument } from './schemas/template.schema';

export type CreateTemplateDto = {
  title: string;
  description?: string;
  code: string;
  language: 'python' | 'typescript' | 'javascript';
};

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(Template.name) private templateModel: Model<TemplateDocument>,
  ) {}

  async create(dto: CreateTemplateDto, authorId: string) {
    const doc = await this.templateModel.create({
      ...dto,
      author: new Types.ObjectId(authorId),
    });
    return doc;
  }

  async findAll(params: {
    q?: string;
    sort?: 'latest' | 'likes';
    page?: number;
    limit?: number;
    authorId?: string; // if provided, filter by author
  }) {
    const { q, sort = 'latest', page = 1, limit = 20, authorId } = params;

    const filter: any = {};
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { code: { $regex: q, $options: 'i' } },
      ];
    }
    if (authorId) {
      filter.author = new Types.ObjectId(authorId);
    }

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

  async findById(id: string) {
    const doc = await this.templateModel.findById(id);
    if (!doc) throw new NotFoundException('Template not found');
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
}
