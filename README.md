# File Tagger

File Tagger adds bracketed tags to file names. Tags are selected in the
Electron UI and appended to the file name before its extension.

## File-name tag format

Each tag is represented by its name enclosed in square brackets:

```text
[TagName]
```

Multiple tags are separated by single spaces:

```text
photo [Outdoor] [Summer] [Portrait].jpg
```

The application treats any text matching this pattern as a tag:

```regex
\[[^\]]+\]
```

This means:

- A tag starts with `[` and ends with the next `]`.
- The tag must contain at least one character.
- Tags may appear anywhere in the file's base name.
- The file extension is kept separate and is not tagged.
- Tag names must not contain `[` or `]` when created through the UI.

### Applying tags

When **Proceed** is selected, the application:

1. Reads the selected files.
2. Finds existing bracketed tags in each base name.
3. Adds selected tags that are not already present.
4. Appends new tags to the end of the base name.
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

## Current tags

**Copy current tags** scans the loaded file names for bracketed tags, removes
duplicates, sorts the results, and copies them as a space-separated string:

```text
[Beach] [Portrait] [Summer]
```

**Copy tags** copies the currently selected tags in the same format.

## File input

Files can be loaded by dragging them into the drop area. The application also
accepts file paths supplied through its command-line integration. Only files
that exist and are writable can be renamed successfully.

## Limitations of the current format

- There is no escaping mechanism for a literal `[` or `]` in a tag.
- Tags are stored in the file name; no separate metadata file is created.
- The parser recognizes bracketed text in the base name regardless of whether
  it came from the File Tagger UI.
- Tag descriptions in `tags.ini` are not written into file names; only the key
  is used.
