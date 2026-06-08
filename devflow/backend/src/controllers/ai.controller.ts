import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { cacheGet, cacheSet } from '../config/redis';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ─── Feature 1: AI Task Breakdown (OpenAI) ────────────────
export const breakdownTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { description } = req.body;
  if (!description) { res.status(400).json({ error: 'Feature description is required' }); return; }

  const cacheKey = `ai:breakdown:${Buffer.from(description).toString('base64').slice(0, 40)}`;
  const cached = await cacheGet(cacheKey);
  if (cached) { res.json(cached); return; }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'system',
      content: 'You are a senior software engineer. Break down features into clear developer subtasks. Always respond with valid JSON only.',
    }, {
      role: 'user',
      content: `Break down this feature into developer subtasks with time estimates.\n\nFeature: ${description}\n\nRespond ONLY with JSON in this exact format:\n{\n  "subtasks": [\n    { "title": "string", "description": "string", "estimateHours": number, "priority": "LOW|MEDIUM|HIGH|CRITICAL" }\n  ],\n  "totalEstimatedHours": number,\n  "suggestedSprint": "string"\n}`,
    }],
    response_format: { type: 'json_object' },
    max_tokens: 1500,
  });

  const result = JSON.parse(completion.choices[0].message.content!);
  await cacheSet(cacheKey, result, 3600);
  res.json(result);
};

// ─── Feature 2: AI Sprint Planner (OpenAI) ───────────────
export const planSprint = async (req: AuthRequest, res: Response): Promise<void> => {
  const { tasks, sprintDays = 14, teamSize = 3 } = req.body;
  if (!tasks?.length) { res.status(400).json({ error: 'Tasks array is required' }); return; }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'system',
      content: 'You are an Agile scrum master. Plan sprints efficiently. Always respond with valid JSON only.',
    }, {
      role: 'user',
      content: `Plan a ${sprintDays}-day sprint for a team of ${teamSize} developers.\n\nTasks: ${JSON.stringify(tasks)}\n\nRespond ONLY with JSON:\n{\n  "sprintName": "string",\n  "sprintGoal": "string",\n  "prioritizedTasks": [\n    { "taskId": "string", "title": "string", "assignedDay": number, "rationale": "string", "risk": "LOW|MEDIUM|HIGH" }\n  ],\n  "excludedTasks": ["taskId"],\n  "totalStoryPoints": number,\n  "sprintSummary": "string"\n}`,
    }],
    response_format: { type: 'json_object' },
    max_tokens: 2000,
  });

  const result = JSON.parse(completion.choices[0].message.content!);
  res.json(result);
};

// ─── Feature 3: AI Bug Explainer (Gemini) ────────────────
export const explainBug = async (req: AuthRequest, res: Response): Promise<void> => {
  const { errorLog, language = 'JavaScript' } = req.body;
  if (!errorLog) { res.status(400).json({ error: 'Error log is required' }); return; }

  try {
    const cacheKey = `ai:bug:${Buffer.from(errorLog).toString('base64').slice(0, 40)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) { res.json(cached); return; }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(`You are a senior ${language} developer. Analyze this error log.

Error Log:
${errorLog}

Respond in this format:

## Root Cause
[plain English explanation]

## Fix
[step-by-step fix with code]

## Prevention
[how to prevent this]

## Severity
[LOW / MEDIUM / HIGH / CRITICAL]`);

    const explanation = result.response.text();
    const response = { explanation, language };
    await cacheSet(cacheKey, response, 3600);
    res.json(response);
  } catch (err: any) {
    console.error('Gemini error:', err.message);
    res.status(500).json({ error: 'AI service temporarily unavailable. Please try again.' });
  }
};

// ─── Feature 4: AI Meeting Summarizer (Gemini) ───────────
export const summarizeMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  const { notes, meetingTitle = 'Team Meeting' } = req.body;
  if (!notes) { res.status(400).json({ error: 'Meeting notes are required' }); return; }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(`Summarize this meeting professionally.

Meeting: ${meetingTitle}
Notes: ${notes}

Format:

## Meeting Summary
[2-3 sentence overview]

## Key Decisions
- [decision]

## Action Items
| Task | Assignee | Deadline |
|------|----------|----------|
| [task] | [name] | [date] |

## Blockers
- [blocker or None]

## Next Steps
- [step]`);

    res.json({ summary: result.response.text(), meetingTitle });
  } catch (err: any) {
    console.error('Gemini error:', err.message);
    res.status(500).json({ error: 'AI service temporarily unavailable. Please try again.' });
  }
};

// ─── Feature 5: AI Roadmap Generator (OpenAI) ────────────
export const generateRoadmap = async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectGoal, teamSize = 3, weeks = 8, techStack = [] } = req.body;
  if (!projectGoal) { res.status(400).json({ error: 'Project goal is required' }); return; }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'system',
      content: 'You are a senior technical product manager. Create detailed project roadmaps. Always respond with valid JSON only.',
    }, {
      role: 'user',
      content: `Create a ${weeks}-week project roadmap.\n\nGoal: ${projectGoal}\nTeam size: ${teamSize}\nTech stack: ${techStack.join(', ')}\n\nRespond ONLY with JSON:\n{\n  "projectName": "string",\n  "overview": "string",\n  "milestones": [\n    {\n      "week": number,\n      "title": "string",\n      "description": "string",\n      "deliverables": ["string"],\n      "tasks": ["string"],\n      "riskLevel": "LOW|MEDIUM|HIGH"\n    }\n  ],\n  "totalEstimatedEffort": "string",\n  "criticalPath": ["string"],\n  "successMetrics": ["string"]\n}`,
    }],
    response_format: { type: 'json_object' },
    max_tokens: 3000,
  });

  const result = JSON.parse(completion.choices[0].message.content!);
  res.json(result);
};

// ─── Feature 6: AI Task Title Suggestions (OpenAI) ───────
export const suggestTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectName, existingTasks = [], context = '' } = req.body;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Suggest 5 next tasks for project "${projectName}".\nContext: ${context}\nExisting tasks: ${existingTasks.slice(0, 10).join(', ')}\n\nRespond ONLY with JSON: { "suggestions": [{ "title": "string", "priority": "string", "estimateHours": number }] }`,
    }],
    response_format: { type: 'json_object' },
    max_tokens: 600,
  });

  res.json(JSON.parse(completion.choices[0].message.content!));
};
