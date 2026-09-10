import { Schema, model, Types } from 'mongoose';

export type PipelineRunStatus =
    | 'planning'
    | 'writing'
    | 'visual_prompts'
    | 'narration'
    | 'metadata'
    | 'video_assembly'
    | 'completed'
    | 'failed';

export interface INarrativeBriefing {
    genre: string;
    period: string;
    tone?: string;
    premise?: string;
}

export interface IVisualPrompt {
    chapter_number: number;
    time_range: string;
    prompt: string;
}

export interface INarrationFile {
    chapter_number: number;
    path: string;
}

export interface IPipelineMetadata {
    titles: string[];
    description: string;
    tags: string;
    closing_question: string;
}

export interface IPipelineCostEntry {
    step: string;
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    estimated_cost_usd: number;
    created_at: Date;
}

export interface IPipelineRun {
    _id?: Types.ObjectId;
    briefing: INarrativeBriefing;
    target_duration_minutes: number;
    chapters_planned: number;
    words_per_chapter_target: { min: number; max: number };
    max_regeneration_attempts: number;
    status: PipelineRunStatus;
    current_step: string;
    error_message?: string;
    visual_prompts: IVisualPrompt[];
    narration_files: INarrationFile[];
    metadata?: IPipelineMetadata;
    final_video_path?: string | null;
    cost_log: IPipelineCostEntry[];
    total_estimated_cost_usd: number;
    created_at: Date;
    updated_at: Date;
}

const BriefingSchema = new Schema<INarrativeBriefing>({
    genre: { type: String, required: true },
    period: { type: String, required: true },
    tone: { type: String },
    premise: { type: String },
}, { _id: false });

const VisualPromptSchema = new Schema<IVisualPrompt>({
    chapter_number: { type: Number, required: true },
    time_range: { type: String, required: true },
    prompt: { type: String, required: true },
}, { _id: false });

const NarrationFileSchema = new Schema<INarrationFile>({
    chapter_number: { type: Number, required: true },
    path: { type: String, required: true },
}, { _id: false });

const MetadataSchema = new Schema<IPipelineMetadata>({
    titles: { type: [String], default: [] },
    description: { type: String, required: true },
    tags: { type: String, required: true },
    closing_question: { type: String, required: true },
}, { _id: false });

const CostEntrySchema = new Schema<IPipelineCostEntry>({
    step: { type: String, required: true },
    model: { type: String, required: true },
    prompt_tokens: { type: Number, default: 0 },
    completion_tokens: { type: Number, default: 0 },
    estimated_cost_usd: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
}, { _id: false });

const PipelineRunSchema = new Schema<IPipelineRun>({
    briefing: { type: BriefingSchema, required: true },
    target_duration_minutes: { type: Number, required: true },
    chapters_planned: { type: Number, required: true },
    words_per_chapter_target: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
    },
    max_regeneration_attempts: { type: Number, default: 2 },
    status: {
        type: String,
        enum: ['planning', 'writing', 'visual_prompts', 'narration', 'metadata', 'video_assembly', 'completed', 'failed'],
        default: 'planning',
    },
    current_step: { type: String, default: 'aguardando_inicio' },
    error_message: { type: String },
    visual_prompts: { type: [VisualPromptSchema], default: [] },
    narration_files: { type: [NarrationFileSchema], default: [] },
    metadata: { type: MetadataSchema },
    final_video_path: { type: String, default: null },
    cost_log: { type: [CostEntrySchema], default: [] },
    total_estimated_cost_usd: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

PipelineRunSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});

export const PipelineRunModel = model<IPipelineRun>('PipelineRun', PipelineRunSchema);
