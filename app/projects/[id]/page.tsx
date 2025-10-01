import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { ProjectWorkspace } from "@/components/projects/project-workspace"

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const { id } = await params

  const client = await clientPromise
  const db = client.db("taskboard")
  const projects = db.collection("projects")
  const tasks = db.collection("tasks")

  const project = await projects.findOne({
    _id: new ObjectId(id),
    userId: session.userId,
  })

  if (!project) {
    redirect("/projects")
  }

  const projectTasks = await tasks.find({ userId: session.userId, projectId: id }).sort({ createdAt: -1 }).toArray()

  const formattedTasks = projectTasks.map((task) => ({
    id: task._id.toString(),
    title: task.title,
    description: task.description || "",
    status: task.status,
    priority: task.priority || "medium",
    assignee: task.assignee,
    dueDate: task.dueDate,
    createdAt: task.createdAt.toISOString(),
  }))

  return (
    <ProjectWorkspace
      project={{
        id: project._id.toString(),
        name: project.name,
        description: project.description || "",
        color: project.color,
        createdAt: project.createdAt.toISOString(),
      }}
      initialTasks={formattedTasks}
    />
  )
}
