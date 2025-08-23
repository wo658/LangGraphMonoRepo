import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type TemplateDocument = Template & Document;

@Schema({ timestamps: true })
export class Template {
  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description?: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, enum: ['python', 'typescript', 'javascript'] })
  language: 'python' | 'typescript' | 'javascript';

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  likedBy: Types.ObjectId[];
  @Prop({ required: true, enum: ['public', 'private'], default: 'private' })
  visibility: 'public' | 'private';
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
TemplateSchema.index({ visibility: 1, author: 1, createdAt: -1 });
