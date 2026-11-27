# Install this Skill — Performance Creative Producer

**Human:** open Claude Code, drag this whole `ad-maker` folder
into the chat, and type:  `install the skill in this folder`

New to Claude Code? Read `SETUP.md` in this folder (or the PDF guide) first.

---

**Claude — when the user drops this in, do this now:**

1. Confirm this folder is named `ad-maker` and contains
   `SKILL.md`, plus `references/` and `config/` subfolders.
2. Find the user's Claude Code skills directory for their operating system:
   - Windows:  `%USERPROFILE%\.claude\skills\`
   - macOS / Linux:  `~/.claude/skills/`
   Create it if it does not exist.
3. Move (or copy) this entire folder into that skills directory, so the result is
   `<skills-dir>/ad-maker/SKILL.md` with its subfolders intact.
   If a `ad-maker` folder is already there, ask before
   overwriting.
4. Verify `<skills-dir>/ad-maker/SKILL.md` now exists. If it
   does not, tell the user to place the folder there manually (see
   `READ-ME-FIRST.txt`) and stop.
5. Tell the user, in these words:

   > Installed. Fully quit Claude Code and reopen it. Then open the folder you
   > keep ad work in and say:  **remix this competitor ad**
   > Read `SETUP.md` in the skill folder if you're new to Claude Code.

Prerequisite the user needs: a Claude paid plan (Claude Code is included). An
`EVOLINK_API_KEY` in the `.env` of their working folder is optional — the Skill
produces paste-ready prompts without one.
