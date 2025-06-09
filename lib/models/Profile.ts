// lib/models/Profile.ts
import mongoose, { Schema, model, models } from 'mongoose';
import { IProfile, RANK_REQUIREMENTS } from '@/lib/types';

const XPEntrySchema = new Schema({
    date: { type: Date, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    source: {
        type: String,
        enum: ['habit_completion', 'daily_bonus', 'chain_completion', 'streak_milestone', 'group_activity'],
        required: true,
        index: true
    },
    description: { type: String, required: true, maxlength: 200 },
    metadata: { type: Schema.Types.Mixed }
}, { _id: false });

const GroupMembershipSchema = new Schema({
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    joinedAt: { type: Date, default: Date.now },
    role: {
        type: String,
        enum: ['member', 'admin', 'owner'],
        default: 'member'
    },
    isActive: { type: Boolean, default: true }
}, { _id: false });

// NEW: Separate XP History collection
const XPHistorySchema = new Schema({
    clerkUserId: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    source: {
        type: String,
        enum: ['habit_completion', 'daily_bonus', 'chain_completion', 'streak_milestone', 'group_activity'],
        required: true,
        index: true
    },
    description: { type: String, required: true, maxlength: 200 },
    metadata: { type: Schema.Types.Mixed }
}, {
    timestamps: false,
    collection: 'xp_history'
});

// Compound index for efficient queries
XPHistorySchema.index({
    clerkUserId: 1,
    date: -1
}, {
    name: 'user_xp_timeline',
    background: true
});

// TTL index for automatic cleanup (optional)
XPHistorySchema.index({
    date: 1
}, {
    expireAfterSeconds: 31536000, // 1 year
    name: 'xp_history_ttl',
    background: true
});


const ProfileSchema = new Schema<IProfile>({
    clerkUserId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    firstName: { type: String, trim: true, maxlength: 50 },
    lastName: { type: String, trim: true, maxlength: 50 },
    userName: { type: String, trim: true, maxlength: 30 },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    bio: { type: String, trim: true, maxlength: 500 },
    timezone: { type: String, default: 'UTC', maxlength: 50 },
    dateFormat: {
        type: String,
        enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
        default: 'MM/DD/YYYY'
    },
    timeFormat: {
        type: String,
        enum: ['12h', '24h'],
        default: '12h'
    },
    theme: {
        type: String,
        enum: ['light', 'dark', 'system', 'midnight', 'forest', 'ocean', 'sunset', 'lavender'],
        default: 'dark'
    },
    notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        habitReminders: { type: Boolean, default: true },
        weeklyReports: { type: Boolean, default: true }
    },
    privacy: {
        profileVisibility: {
            type: String,
            enum: ['public', 'private'],
            default: 'private'
        },
        showStreak: { type: Boolean, default: true },
        showProgress: { type: Boolean, default: true },
        showRank: { type: Boolean, default: true }
    },
    goals: {
        dailyHabitTarget: { type: Number, default: 3, min: 1, max: 20 },
        weeklyGoal: { type: Number, default: 21, min: 1, max: 140 }
    },
    // Simplified XP System - only total XP matters
    xp: {
        total: { type: Number, default: 0, min: 0, index: true },
        lastUpdated: { type: Date, default: Date.now }
    },
    // Rank based on total XP using RANK_REQUIREMENTS
    rank: {
        title: {
            type: String,
            enum: ['Novice', 'Beginner', 'Apprentice', 'Practitioner', 'Expert', 'Master', 'Grandmaster', 'Legend'],
            default: 'Novice'
        },
        level: { type: Number, default: 1, min: 1, max: 8 },
        progress: { type: Number, default: 0, min: 0, max: 100 },
        lastCalculated: { type: Date, default: Date.now }
    },
    // XP History - limit size for performance
    recentXP: {
        last7Days: { type: Number, default: 0 },
        last30Days: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now }
    },
    // Add this field in the main schema definition (after recentXP field)
    xpHistory: {
        type: [XPEntrySchema],
        default: [],
        validate: {
            validator: function (history: any[]) {
                return history.length <= 1000; // Limit history size
            },
            message: 'XP history too large'
        }
    },
    // Group memberships
    groups: {
        type: [GroupMembershipSchema],
        default: [],
        validate: {
            validator: function (groups: any[]) {
                return groups.length <= 50;
            },
            message: 'Too many group memberships.'
        }
    },
    stats: {
        totalHabitsCreated: { type: Number, default: 0, min: 0 },
        totalCompletions: { type: Number, default: 0, min: 0 },
        longestStreak: { type: Number, default: 0, min: 0 },
        totalChainsCompleted: { type: Number, default: 0, min: 0 },
        dailyBonusesEarned: { type: Number, default: 0, min: 0 },
        totalGroupsJoined: { type: Number, default: 0, min: 0 },
        joinedAt: { type: Date, default: Date.now },
        currentStreak: { type: Number, default: 0, min: 0 },
        lastActivityAt: { type: Date, default: Date.now, index: true },
        avgDailyXP: { type: Number, default: 0, min: 0 }
    },
    // Cache fields for leaderboard performance
    rankCache: {
        globalPosition: { type: Number, min: 1 },
        lastUpdated: { type: Date, default: Date.now }
    }
}, {
    timestamps: true,
    // Optimize JSON output
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            delete ret.__v;
            delete ret.rankCache; // Don't expose cache in API
            return ret;
        }
    },
    // Enable auto-indexing for development only
    autoIndex: process.env.NODE_ENV !== 'production'
});

// Compound indexes for complex queries
ProfileSchema.index({ clerkUserId: 1 }, { unique: true });
ProfileSchema.index({ email: 1 }, { unique: true });
ProfileSchema.index({ 'xp.total': -1, 'rank.level': -1 }); // Leaderboard queries
ProfileSchema.index({ 'stats.lastActivityAt': -1 }); // Recent activity
ProfileSchema.index({ 'groups.groupId': 1, 'groups.isActive': 1 }); // Group queries
ProfileSchema.index({ 'privacy.profileVisibility': 1, 'xp.total': -1 }); // Public profiles
ProfileSchema.index({ 'rank.title': 1, 'xp.total': -1 }); // Rank-based queries
ProfileSchema.index({ createdAt: -1 }); // Recent users

// Virtual for full name
ProfileSchema.virtual('fullName').get(function () {
    if (this.firstName && this.lastName) {
        return `${this.firstName} ${this.lastName}`;
    }
    return this.firstName || this.lastName || this.userName || 'Anonymous';
});

// Calculate rank from XP
function calculateRankFromXP(totalXP: number) {
    for (const [level, requirements] of Object.entries(RANK_REQUIREMENTS)) {
        if (totalXP >= requirements.minXP && totalXP <= requirements.maxXP) {
            const progress = requirements.maxXP === Infinity ? 100 :
                Math.round(((totalXP - requirements.minXP) / (requirements.maxXP - requirements.minXP)) * 100);

            return {
                title: requirements.title,
                level: parseInt(level),
                progress: Math.min(100, Math.max(0, progress))
            };
        }
    }
    return { title: 'Novice', level: 1, progress: 0 };
}

// Pre-save middleware for optimization
ProfileSchema.pre('save', function (next) {
    // Update rank based on XP
    if (this.isModified('xp.total') || !this.rank.lastCalculated) {
        const newRank = calculateRankFromXP(this.xp.total);
        this.rank.title = newRank.title as any;
        this.rank.level = newRank.level;
        this.rank.progress = newRank.progress;
        this.rank.lastCalculated = new Date();
    }

    // Update XP lastUpdated timestamp
    if (this.isModified('xp.total')) {
        this.xp.lastUpdated = new Date();
    }

    // Calculate average daily XP
    if (this.xpHistory.length > 0) {
        const daysSinceJoined = Math.max(1, Math.ceil((new Date().getTime() - this.stats.joinedAt.getTime()) / (1000 * 60 * 60 * 24)));
        this.stats.avgDailyXP = Math.round(this.xp.total / daysSinceJoined);
    }

    // Trim XP history if too large
    if (this.xpHistory.length > 1000) {
        this.xpHistory = this.xpHistory
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 1000);
    }

    next();
});

// Static methods for common operations
ProfileSchema.statics.findByClerkUserId = function (clerkUserId: string) {
    return this.findOne({ clerkUserId }).lean();
};

ProfileSchema.statics.updateXP = async function (
    clerkUserId: string,
    amount: number,
    source: string,
    description: string,
    metadata?: any
) {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            // Create XP history record
            await mongoose.model('XPHistory').create([{
                clerkUserId,
                date: new Date(),
                amount,
                source,
                description,
                metadata
            }], { session });

            // Update profile XP atomically
            await mongoose.model('Profile').findOneAndUpdate(
                { clerkUserId },
                {
                    $inc: { 'xp.total': amount },
                    $set: {
                        'xp.lastUpdated': new Date(),
                        'stats.lastActivityAt': new Date()
                    }
                },
                { session, new: true }
            );
        });
    } finally {
        await session.endSession();
    }
};

export const XPHistory = models.XPHistory || model('XPHistory', XPHistorySchema);

ProfileSchema.statics.getLeaderboard = function (limit: number = 100, includePrivate: boolean = false) {
    const query = includePrivate ? {} : { 'privacy.profileVisibility': 'public' };

    return this.find(query)
        .select('clerkUserId firstName lastName userName xp rank stats.lastActivityAt')
        .sort({ 'xp.total': -1, 'rank.level': -1 })
        .limit(limit)
        .lean();
};

ProfileSchema.statics.bulkUpdateRankCache = async function () {
    const profiles = await this.find({})
        .select('clerkUserId xp.total')
        .sort({ 'xp.total': -1 })
        .lean();

    const bulkOps = profiles.map((profile, index) => ({
        updateOne: {
            filter: { clerkUserId: profile.clerkUserId },
            update: {
                'rankCache.globalPosition': index + 1,
                'rankCache.lastUpdated': new Date()
            }
        }
    }));

    if (bulkOps.length > 0) {
        await this.bulkWrite(bulkOps);
    }
};

export const Profile = models.Profile || model<IProfile>('Profile', ProfileSchema);