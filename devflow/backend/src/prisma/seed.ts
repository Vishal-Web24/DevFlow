import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // demo users
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const vishal = await prisma.user.upsert({
    where: { email: 'vishal@devflow.com' },
    update: {},
    create: {
      name: 'Vishal Munde',
      email: 'vishal@devflow.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@devflow.com' },
    update: {},
    create: {
      name: 'Alice Johnson',
      email: 'alice@devflow.com',
      password: hashedPassword,
    },
  });

  //  demo project
  const project = await prisma.project.create({
    data: {
      name: 'DevFlow Platform',
      description: 'AI-Powered Project Management Platform',
      color: '#3B82F6',
      members: {
        create: [
          { userId: vishal.id, role: 'OWNER' },
          { userId: alice.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Create sprint
  const sprint = await prisma.sprint.create({
    data: {
      name: 'Sprint 1',
      goal: 'Launch MVP with auth and Kanban',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      projectId: project.id,
    },
  });

  //  tasks
  const taskData = [
    { title: 'Set up authentication system', status: 'DONE', priority: 'HIGH', position: 0 },
    { title: 'Build Kanban board with drag-and-drop', status: 'IN_PROGRESS', priority: 'HIGH', position: 0 },
    { title: 'Integrate OpenAI for task breakdown', status: 'IN_PROGRESS', priority: 'CRITICAL', position: 1 },
    { title: 'Add real-time collaboration via Socket.io', status: 'TODO', priority: 'HIGH', position: 0 },
    { title: 'Write unit tests for auth endpoints', status: 'TODO', priority: 'MEDIUM', position: 1 },
    { title: 'Containerize with Docker', status: 'TODO', priority: 'MEDIUM', position: 2 },
    { title: 'Set up CI/CD with GitHub Actions', status: 'IN_REVIEW', priority: 'HIGH', position: 0 },
    { title: 'Deploy backend to AWS EC2', status: 'TODO', priority: 'HIGH', position: 3 },
  ];

  for (const task of taskData) {
    await prisma.task.create({
      data: {
        ...task,
        status: task.status as any,
        priority: task.priority as any,
        projectId: project.id,
        creatorId: vishal.id,
        assigneeId: Math.random() > 0.5 ? vishal.id : alice.id,
        sprintId: sprint.id,
      },
    });
  }

  console.log('✅ Seed complete!');
  console.log('👤 Demo login: vishal@devflow.com / Password123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
