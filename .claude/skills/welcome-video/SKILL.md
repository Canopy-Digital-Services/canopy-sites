---
name: welcome-video
description: Make a client's welcome video for one tab of their Canopy Sites portal from Michael's screen recording, correct its captions, and upload it on the operator's site page (ROADMAP E39). Use when Michael hands over a recording for a site's Quick Edit, Editor, Forms or Stats tab, or asks to fix a welcome video's captions.
argument-hint: <recording> <site> <tab>
---

# Welcome video

A recording becomes a tab's welcome video in four steps: the client's words, the prepare command, the captions read through, the upload. What the video is and how it plays is ROADMAP E39. The prepare command's own options are in its docstring, `apps/portal/scripts/prepare-welcome-video.py`.

You need the recording's path, the site, and the tab (Quick Edit, Editor, Forms or Stats; the ids are in `apps/portal/src/lib/sites-tabs.ts`). Ask for whichever is missing. The portal is production (`https://sites.canopyds.com`) unless Michael names dev (`https://sites-dev.canopyds.com`) or local (`http://sites.localhost:3006`). Open the operator pages on that Sites host, not the Forms one: Act as client keeps the session on the host it starts from, and the two hosts don't share a sign-in. A recording is client media: never commit one. Inside this repo it goes in `temp/`, which git ignores.

## 1. The client's words

Whisper spells a name it doesn't know as it likes, so the command takes the client's words in `--words`. Collect them from:

- The operator's site page (`/operator/sites`, then the site): the business name, each person's name on the People card, and the production hostnames.
- The site's repo (named on that page; `gh repo clone` it to the scratchpad when no clone is at hand): `SITE_GUIDE.md` and `src/content/*.json`, for the proper nouns Michael is likely to say, such as a service, a staff member, a place.

Keep the list to about a dozen: Whisper keeps only the last 223 tokens of its prompt, and the portal's own words come first, so a long list pushes them out. Keep the rest of what you read for step 3.

## 2. Prepare

From the repo root:

```bash
uv run apps/portal/scripts/prepare-welcome-video.py "<recording>" --words "<business name, people's names, the site's address, ...>"
```

It takes about a minute for two minutes of speech. It writes `<recording>-welcome.mp4` and `<recording>-welcome.vtt` beside the recording and lists the captions holding a word Whisper was unsure of.

## 3. The captions

Read the whole `.vtt`, not only the listed captions: a word heard wrongly with confidence isn't listed. Correct it against the portal's names as its screens spell them (Quick Edit, the Editor, Preview, Publish, Discard), the client's words, and the site's content from step 1. The usual mistakes are a name taken for an ordinary word ("editors" for the Editor), a homophone, and a web address spelled out wrongly. Change only the text: keep each cue's number and times, at most two lines of about 42 characters, and `&`, `<` and `>` escaped as `&amp;`, `&lt;` and `&gt;`.

You can't hear the recording. For every place the text alone doesn't settle (each listed word you didn't resolve, and any change you made on a guess), give Michael the time, the caption, and what is in doubt, and wait for his answers before uploading.

## 4. Upload

In the browser (Claude in Chrome), on the operator's site page, the Welcome videos card has a row for each tab.

- **A tab with no video:** its row's Upload.
- **A tab that has one:** ask Michael first which he wants. Replace starts everyone's watched figures over, but the new video doesn't open by itself for anyone already shown the old one. Remove and then Upload shows it once to everyone, as a first video does. Replace with the same MP4 and corrected captions changes nobody's figures, which is how a caption fix goes up.

In the dialog, find the Video and Captions file inputs (`#welcome-video`, `#welcome-captions`) and give each its file with `file_upload`, one call each, since the tool takes 10 MB a call. Never click a file input: that opens the system's file picker. A video over 10 MB (about five minutes) is beyond the tool: give Michael the two paths to choose himself. Press the dialog's Upload (or Replace); the row then reads "Uploaded" with the date.

If the page asks for a sign-in, Michael signs in himself. Never type his password.

## 5. Check it

People card → Act as client, then open the tab. Acting as the client the video never opens by itself: open the help button (bottom right) → Welcome video. It plays, the corrected captions show in the strip under the picture, and a seek lands on the caption for that moment. Close it, then Stop.

Tell Michael it's up, where the two files are, and that the original recording is the backup: the media volume isn't backed up, and the pair can be made again from it.
