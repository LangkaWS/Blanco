# Commands list

when you encounter data between curly braces (e.g. `{data}`), you need to replace the data AND the curly braces with the data you want to provide. Examples are given when needed.

## Admin
- `!blanco admin`: create or edit Blanco's admin roles.
- `!blanco help`: diplay help about Admin feature.

## Birthday
- `!bd setup`: create or edit setup for Birthdays feature (birthdays channel and message).
- `!bd go`: enable automatic birthday messages from Blanco.
- `!bd stop`: disable automatic birthday messages from Blanco.
- `!bd add {DD/MM}`: add the provided date as the author's birthday. The date ormat must be DD/MM, e.g. `!bd add 31/01`.
- `!bd remove`: remove the author's birthday.
- `!bd help`: display help about Birthdays feature.

## Music
- `!m play {youtube_url}`: play the music from the URL. You need to be in a voice channel. E.g. `!m play https://youtu.be/dQw4w9WgXcQ`.
- `!m pause`: pause the current music. You need to be in the same voice channel as Blanco.
- `!m resume`: resume the paused music if any. You need to be in the same voice channel as Blanco.
- `!m skip`: skip the current music. You need to be in the same voice channel as Blanco.
- `!m stop`: stop the playlist and Blanco leaves the voice channel. You need to be in the same voice channel as Blanco.
- `!m help`: display help aboit Music feature.

## Reaction roles
- `!rr create`: create a reaction roles menu.
- `!rr modify`: edit a reaction roles menu. You need to reply to the menu you want to edit.
- `!rr delete`: delete a reaction roles menu. You need to reply to the menu you want to delete.
- `!rr add`: add a role to a reaction roles menu. You need to reply to the menu you want to add a role to.
- `!rr remove {@role}`: remove the provided role from a reaction roles menu. You need to reply to the menu you want to remove the role from. E.g. reply to a rr menu with `!rr remove @myRole`.
- `!rr help`: display help about Reaction roles feature.

## Stream
- `!str setup`: create or edit setup for Twitch stream announcements.
- `!str go`: enable automatic messages from Blanco when a member's stream start.
- `!str stop`: disable automatic messages from Blanco on
- `!str help`