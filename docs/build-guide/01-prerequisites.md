# 01 — Prerequisites & Setup

Before writing any code, you need to install the tools that make everything work. Think of these as the "workshop equipment" you need before building furniture.

---

## What You Need to Install

### 1. .NET 11 SDK

**What it is:** The software development kit for building the backend server. It includes the C# compiler and the `dotnet` command-line tool.

**How to install:**
1. Go to [https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download)
2. Download the **.NET 11 SDK** (not "Runtime" — you need the full SDK)
3. Run the installer and follow the prompts
4. Verify it worked by opening a terminal and typing:

```bash
dotnet --version
```

You should see something like `11.0.100` or similar.

> **What is a terminal?** It is the text-based interface where you type commands. On Windows, search for "Terminal" or "Command Prompt." On Mac, search for "Terminal." On Linux, it is usually called "Terminal."

---

### 2. Node.js and npm

**What it is:** Node.js runs JavaScript outside a web browser. npm (Node Package Manager) installs JavaScript libraries. The frontend is built with these.

**How to install:**
1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS** (Long Term Support) version
3. Run the installer
4. Verify:

```bash
node --version
npm --version
```

You should see version numbers (e.g., `v22.x.x` and `10.x.x`).

---

### 3. A Code Editor

**What it is:** A program where you write and edit code. It is like a specialized word processor for programming.

**Recommended: Visual Studio Code (VS Code)**
1. Go to [https://code.visualstudio.com](https://code.visualstudio.com)
2. Download and install it
3. Install these helpful extensions (inside VS Code, click the Extensions icon on the left sidebar):
   - **C#** (by Microsoft) — for backend code
   - **Angular Language Service** (by Angular) — for frontend code

> **Alternative editors:** You can use any text editor. JetBrains Rider (for C#) and WebStorm (for Angular) are excellent paid alternatives. Even Notepad works in a pinch, but VS Code is free and has the best support.

---

### 4. Git (Optional but Recommended)

**What it is:** A version control system that tracks changes to your code. Think of it as an "undo history" for your entire project.

**How to install:**
1. Go to [https://git-scm.com](https://git-scm.com)
2. Download and install
3. Verify:

```bash
git --version
```

---

## Creating Your Project Folder

Open your terminal and create a folder for the project:

```bash
mkdir GraceWord
cd GraceWord
```

If you installed Git, initialize a repository:

```bash
git init
```

---

## Verify Everything Works

Run these commands one by one. Each should print a version number without errors:

```bash
dotnet --version
node --version
npm --version
```

If any command fails, revisit the installation step for that tool.

---

## For Alternative Stack Builders

If you plan to build this project in a different technology, here are the equivalent prerequisites:

| This Project Uses | Python Alternative | Node.js Alternative | Java Alternative |
|---|---|---|---|
| .NET 11 SDK | Python 3.11+ | Node.js 22+ (same install) | JDK 21+ |
| Entity Framework Core | SQLAlchemy or Django ORM | Prisma or Sequelize | Spring Data JPA + Hibernate |
| ASP.NET Core | Flask or Django | Express.js or Fastify | Spring Boot |
| Angular | React, Vue, or Svelte | React, Vue, or Svelte | React, Vue, or Svelte |

The frontend frameworks (React, Vue, Svelte) all require Node.js and npm regardless of your backend choice.

---

[<<< Back to Overview](00-overview.md) | [Next: Key Concepts >>>](02-concepts.md)
