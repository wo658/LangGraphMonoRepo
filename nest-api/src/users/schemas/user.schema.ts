import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, enum: ['github', 'google'] })
  provider: 'github' | 'google';

  @Prop({ required: true })
  providerId: string;

  @Prop()
  email?: string;

  @Prop()
  name?: string;

  @Prop()
  avatarUrl?: string;

  // 12-hour token quota: remaining tokens in the current 12-hour window (server-uptime based)
  @Prop({ type: Number, default: 15000 })
  aiTokensRemaining12h?: number;
}

export const UserSchema = SchemaFactory.createForClass(User);