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

  @Prop({
    type: {
      monthKey: String,
      requestCount: { type: Number, default: 0 },
      tokenCount: { type: Number, default: 0 },
      limits: {
        request: { type: Number, default: 1000 },
        tokens: { type: Number, default: 100000 },
      },
    },
    default: () => ({
      monthKey: new Date().toISOString().slice(0, 7),
      requestCount: 0,
      tokenCount: 0,
      limits: {
        request: 1000,
        tokens: 100000,
      },
    }),
  })
  aiUsage: {
    monthKey: string;
    requestCount: number;
    tokenCount: number;
    limits?: {
      request?: number;
      tokens?: number;
    };
  };
}

export const UserSchema = SchemaFactory.createForClass(User);