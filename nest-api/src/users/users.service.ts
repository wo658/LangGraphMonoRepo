import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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
}