import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likedBy: Types.ObjectId[];
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
