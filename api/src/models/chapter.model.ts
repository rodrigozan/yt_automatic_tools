import { Schema, model, Types } from 'mongoose';

export type ChapterStatus = 'draft' | 'approved' | 'revisao_manual_necessaria';
export type IssueSeverity = 'bloqueante' | 'alerta';

export interface IContinuityIssue {
    description: string;
    severity: IssueSeverity;
}

export interface IContinuityCheck {
    attempt: number;
    issues: IContinuityIssue[];
    checked_at: Date;
}

export interface IChapter {
    _id?: Types.ObjectId;
    pipeline_run_id: Types.ObjectId;
    chapter_number: number;
    text: string;
    word_count: number;
    summary: string;
    status: ChapterStatus;
    continuity_checks: IContinuityCheck[];
    created_at: Date;
}

const ContinuityIssueSchema = new Schema<IContinuityIssue>({
    description: { type: String, required: true },
    severity: { type: String, enum: ['bloqueante', 'alerta'], required: true },
}, { _id: false });

const ContinuityCheckSchema = new Schema<IContinuityCheck>({
    attempt: { type: Number, required: true },
    issues: { type: [ContinuityIssueSchema], default: [] },
    checked_at: { type: Date, default: Date.now },
}, { _id: false });

const ChapterSchema = new Schema<IChapter>({
    pipeline_run_id: { type: Schema.Types.ObjectId, required: true, ref: 'PipelineRun' },
    chapter_number: { type: Number, required: true },
    text: { type: String, default: '' },
    word_count: { type: Number, default: 0 },
    summary: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'approved', 'revisao_manual_necessaria'], default: 'draft' },
    continuity_checks: { type: [ContinuityCheckSchema], default: [] },
    created_at: { type: Date, default: Date.now },
});

ChapterSchema.index({ pipeline_run_id: 1, chapter_number: 1 }, { unique: true });

export const ChapterModel = model<IChapter>('Chapter', ChapterSchema);
