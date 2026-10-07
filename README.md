# File Tagger

File Tagger adds bracketed tags to file names. Tags are selected in the
Electron UI and appended to the file name before its extension.

## File-name tag format

The legacy format represents each tag by its name enclosed in its own pair of
square brackets:

```text
[TagName]
```

Multiple tags are separated by single spaces:

```text
photo [Outdoor] [Summer] [Portrait].jpg
```

The application continues to recognize this legacy format using:

```regex
\[[^\[\]]+\]
```

This means:

- A tag starts with `[` and ends with the next `]`.
- The tag must contain at least one character.
- Tags may appear anywhere in the file's base name.
- The file extension is kept separate and is not tagged.
- Tag names must not contain `[` or `]` when created through the UI.

## Multiple-tag format

New tag operations use one bracketed block for all selected tags. Individual
tag names are separated by one or more spaces, commas, or a combination:

```text
photo [Outdoor Summer Portrait].jpg
photo [Outdoor,Summer,Portrait].jpg
photo [Outdoor, Summer Portrait].jpg
```

The format is recognized using:

```regex
\[[^\[\],\s]+(?:[\s,]+[^\[\],\s]+)+\]
```

The individual names in this format cannot contain whitespace, commas, or
square brackets because those characters are separators or delimiters. The
legacy single-tag format remains supported for tags that do not use the new
format's separators. A legacy tag containing spaces is inherently ambiguous
with the new format and will be interpreted as multiple tags.

### Applying tags

When **Proceed** is selected, the application:

1. Reads the selected files.
2. Finds existing bracketed tags in each base name.
3. Adds selected tags that are not already present.
4. Appends newly selected tags to the end of the base name as one
   multiple-tag block.
5. Preserves the original extension.
6. Skips the rename when applying the selection would not change the name.

For example:

```text
Before:  image [旅行].png
Selected: [Beach] [Summer]
After:   image [旅行].png [Beach] [Summer].png
```

Existing tags remain in their original position. A tag is considered already
present when its complete bracketed form matches exactly, including letter
case.

## `tags.ini` catalogue format

The selectable tags are stored in [`tags.ini`](./tags.ini) using INI sections.
Each section is a tag group, and each key in that section is a tag name:

```ini
[Location]
Beach=
Mountains=
Travel=

[Status]
Reviewed=true
NeedsReview=
```

The value after `=` is not used when creating a file-name tag. Empty values are
the normal form, but values such as `true` or descriptive text are also
accepted and preserved.

### Groups and tags

- Section names become groups in the UI.
- Keys become selectable tags in their group.
- Group names may contain letters, numbers, spaces, dashes, and underscores.
- Tag names added through the UI may contain letters, numbers, spaces, dashes,
  and other characters except `[` and `]`.
- Group and tag names are sorted alphabetically in the UI and when new entries
  are saved.
- Group names and tag names are case-insensitive for duplicate checks when
  adding them through the UI.

If `tags.ini` does not exist, the application creates it with this default
structure:

```ini
[ExampleGroup]
ExampleTag=
```

## Person tags

Person tags are stored separately in [`database/people.txt`](./database/people.txt).
They always begin with `@` and are grouped in sections. A person entry starts
with its tag and may have `name`, `photo`, and comma-separated `links`
attributes:

```text
[Friends]
@alice
name=Alice Example
photo=https://example.com/alice.jpg
links=https://example.com/alice, https://github.com/example
```

The Person tags tab displays these entries and uses the same search box as the
Regular tags tab. Selecting a person applies the `@` tag to the filename using
the same bracketed tag format as regular tags, for example `[@alice]`.

## Current tags

**Copy current tags** scans both tag formats, removes duplicates, sorts the
results, and copies them using the new multiple-tag format:

```text
[Beach Portrait Summer]
```

**Copy tags** copies the currently selected tags in the new format as well.

## File input

Files can be loaded by dragging them into the drop area. The application also
accepts file paths supplied through its command-line integration. Only files
that exist and are writable can be renamed successfully.

## Format limitations

- There is no escaping mechanism for a literal `[` or `]` in a tag.
- Tags are stored in the file name; no separate metadata file is created.
- The parser recognizes bracketed text in the base name regardless of whether
  it came from the File Tagger UI.
- New-format tag names cannot contain spaces or commas. Such names are
  emitted using the legacy per-tag form when added through the UI, but a
  bracket block containing spaces is inherently interpreted as the new format
  when it is parsed.
- Tag descriptions in `tags.ini` are not written into file names; only the key
  is used.
