import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // Escape regex special characters in user input
  private escapeRegex(input: string) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async upsertOAuthUser(profile: {
    provider: 'github' | 'google';
    providerId: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  }): Promise<UserDocument> {
    const { provider, providerId, ...updateData } = profile;

    const user = await this.userModel.findOneAndUpdate(
      { provider, providerId },
      {
        $set: {
          ...updateData,
          ...(updateData.email && { email: updateData.email }),
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.avatarUrl && { avatarUrl: updateData.avatarUrl }),
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    return user;
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByProviderId(
    provider: 'github' | 'google',
    providerId: string,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne({ provider, providerId }).exec();
  }

  async search(q: string, limit = 10, excludeUserId?: string) {
    const query = (q || '').trim();
    if (!query) return [];

    const safe = this.escapeRegex(query);
    const filter: any = {
      $or: [
        { name: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } },
      ],
    };
    if (excludeUserId) {
      filter._id = { $ne: new Types.ObjectId(excludeUserId) };
    }

    return this.userModel
      .find(filter)
      .limit(Math.min(Math.max(limit, 1), 50))
      .select({ name: 1, email: 1, avatarUrl: 1 })
      .lean()
      .exec();
  }
}