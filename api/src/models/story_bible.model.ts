import { Schema, model, Types } from 'mongoose';

export interface ICharacterRelationship {
    with: string;
    type: string;
}

export interface ICharacter {
    name: string;
    role: string;
    age: number;
    appearance: string;
    personality: string[];
    secret?: string | null;
    relationships: ICharacterRelationship[];
}

export interface IOutlineItem {
    chapter_number: number;
    summary_planned: string;
}

export interface IStoryBible {
    _id?: Types.ObjectId;
    pipeline_run_id: Types.ObjectId;
    title: string;
    genre: string;
    period: string;
    location: string;
    tone: string[];
    characters: ICharacter[];
    story_rules: string[];
    central_goal: string;
    outline: IOutlineItem[];
    created_at: Date;
}

const CharacterRelationshipSchema = new Schema<ICharacterRelationship>({
    with: { type: String, required: true },
    type: { type: String, required: true },
}, { _id: false });

const CharacterSchema = new Schema<ICharacter>({
    name: { type: String, required: true },
    role: { type: String, required: true },
    age: { type: Number, required: true },
    appearance: { type: String, required: true },
    personality: { type: [String], default: [] },
    secret: { type: String, default: null },
    relationships: { type: [CharacterRelationshipSchema], default: [] },
}, { _id: false });

const OutlineItemSchema = new Schema<IOutlineItem>({
    chapter_number: { type: Number, required: true },
    summary_planned: { type: String, required: true },
}, { _id: false });

const StoryBibleSchema = new Schema<IStoryBible>({
    pipeline_run_id: { type: Schema.Types.ObjectId, required: true, ref: 'PipelineRun', unique: true },
    title: { type: String, required: true },
    genre: { type: String, required: true },
    period: { type: String, required: true },
    location: { type: String, required: true },
    tone: { type: [String], default: [] },
    characters: { type: [CharacterSchema], default: [] },
    story_rules: { type: [String], default: [] },
    central_goal: { type: String, required: true },
    outline: { type: [OutlineItemSchema], default: [] },
    created_at: { type: Date, default: Date.now },
});

export const StoryBibleModel = model<IStoryBible>('StoryBible', StoryBibleSchema);
