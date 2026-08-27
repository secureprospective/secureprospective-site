# LibreOffice made familiar to Microsoft Office users

Research report for SP+. No LibreOffice files, profiles, packages, builds, VMs, or repository files were changed during this research.

## Scope and version

The target named in the brief is Fedora 44. Fedora Packages currently lists LibreOffice **26.2.5.2-1.fc44** as the stable Fedora 44 package; package updates can change the final patch version, so the build should verify with `libreoffice --version`. The configuration findings below are checked against the LibreOffice `libreoffice-26-2` source branch, not just generic old forum instructions.

LibreOffice 26.2 is the relevant version for Fedora 44. Where an older source is quoted, it is labelled. The core source files are stronger evidence for key names and filter identifiers than a GUI screenshot.

## Deployment model: what belongs where

### Per-user defaults

LibreOffice's normal Linux profile is:

```text
~/.config/libreoffice/4/user/
```

For SP+, seed the settings in:

```text
/etc/skel/.config/libreoffice/4/user/registrymodifications.xcu
```

because SP+ creates no user account in the image. Seed only the needed `<item>` entries and preserve any existing file if the image process already creates one. LibreOffice must be closed when this file is changed. This is the user layer; an advisor can generally override it later.

`registrymodifications.xcu` is an override file, not a copy of the full LibreOffice registry. Its compact `<oor:items>` syntax is the right syntax for a user profile.

### System-wide defaults

The supported deployment mechanism is a **configuration-only LibreOffice extension** (`.oxt`) containing `.xcu` component-data files, installed shared while LibreOffice is not running. The LibreOffice configuration-extension guide says that this layer overrides installation defaults but is normally overridden by user settings. Use `oor:finalized="true"` only for settings that must be enforced; it can disable controls or make a setting impossible to change safely.

A `.xcu` component-data file is appropriate inside the shared `.oxt`. A file directly under a LibreOffice `share/registry/` directory must use `.xcd`/component registry syntax; copying the `<oor:items>` form there is not equivalent. Do not edit the vendor's `main.xcd` or installed registry files: upgrades can replace them. Fedora's exact LibreOffice installation prefix is package-dependent.

For SP+'s first-user experience, the practical split is:

* **System-wide/image content:** install the replacement fonts and the Colibre icon-theme assets; ship the configuration extension if SP+ wants defaults to affect already-created profiles.
* **`/etc/skel`:** seed the user-facing defaults listed below, because the image has no user account and these preferences are per-user.
* **Enforcement:** do not finalize the visual settings unless SP+ has explicitly decided that advisors must not change them.

The same key/value can be represented in both layers. The examples below give the exact user-profile key first; the corresponding component-data hierarchy is obvious from the path and is shown where it helps deployment.

## Recommended baseline

| Area | Recommendation | Exact configuration | Layer | Verification |
|---|---|---|---|---|
| Ribbon | Use full **Tabbed**, not Tabbed Compact, for Writer, Calc, Impress, and Draw | `/org.openoffice.Office.UI/ToolbarMode/Applications/{Writer,Calc,Impress,Draw}/Active = notebookbar.ui` | Per-user; also suitable in shared config extension | View > User Interface visibly says **Tabbed** and shows File/Home/Insert-style tabs |
| Menu bar | Leave it hidden for the closest Office ribbon match | `.../Modes/Tabbed/HasMenubar = false` (the 26.2 default is already false) | Per-user/shared default | No traditional File/Edit menu row above the tabs; the File tab remains available |
| Icons | Explicitly select **Colibre** | `/org.openoffice.Office.Common/Misc/SymbolStyle = colibre` | Per-user; install theme assets system-wide | Tools > Options > LibreOffice > View/Appearance > Icon theme shows Colibre |
| Save formats | Writer `.docx`, Calc `.xlsx`, Impress `.pptx` | `ooSetupFactoryDefaultFilter` values below | Per-user/shared default | Save As type and a new-document Save test produce the selected extension |
| Foreign-format warning | Disable the repeated warning only if SP+ accepts the compatibility risk | `/org.openoffice.Office.Common/Save/Document/WarnAlienFormat = false` | Per-user/shared default | Save a document in the selected OOXML default and confirm no warning; save as ODF/another foreign format only in QA to confirm the trade-off |
| Office fonts | Substitute absent Calibri/Cambria/Times New Roman with metrically compatible open fonts | FontPairs below | Per-user; replacement font files system-wide | `fc-match` finds each replacement; a test DOCX displays through the replacement table |
| New Writer documents | Use Carlito for body text and Caladea for headings | `/org.openoffice.Office.Writer/DefaultFont` values below | Per-user/shared default | Tools > Options > LibreOffice Writer > Basic Fonts (Western) shows the values |
| Recent documents | Keep the normal Start Center, but show recent documents across modules | `History/PickListSize = 25`; `History/ShowCurrentModuleOnly = false` | Per-user/shared default | Close all documents: Start Center shows recent documents from Writer/Calc/Impress together |
| Shortcut policy | Do not replace all shortcuts with an unverified third-party Office map | Use the built-in `Tools > Customize > Keyboard`; optional import format is `.cfg` | Per-user | Ctrl+S/O/P, Ctrl+C/X/V/Z/B/I/U work; module-specific shortcuts are tested before any change |

## 1. Ribbon-style interface / NotebookBar

The official 26.2 Help describes **Tabbed** as the NotebookBar variant most similar to Microsoft Office ribbons. It says that Tabbed uses contextual tabs and makes the traditional main menu obsolete. Tabbed Compact is the same general idea in one row and is intended for smaller screens. Groupedbar Compact is not a ribbon: it presents contextual groups rather than Office-like tabs. For advisors aged 45–65 using normal desktop displays, the full Tabbed variant exposes more controls and creates less hidden overflow than Tabbed Compact.

The 26.2 source data defines these exact command arguments:

```text
Tabbed              -> notebookbar.ui
Tabbed Compact      -> notebookbar_compact.ui
Groupedbar Compact  -> notebookbar_groupedbar_compact.ui
Contextual Single    -> notebookbar_single.ui
```

Formula/Math and Base do **not** define a `HasNotebookbar=true` mode in the 26.2 source data. Do not promise a ribbon for those two modules; leave their normal toolbars alone.

### Exact user-profile entries

Put these entries in `/etc/skel/.config/libreoffice/4/user/registrymodifications.xcu` (inside one existing `<oor:items>` root):

```xml
<item oor:path="/org.openoffice.Office.UI/ToolbarMode/Applications/Writer">
  <prop oor:name="Active" oor:op="fuse"><value>notebookbar.ui</value></prop>
</item>
<item oor:path="/org.openoffice.Office.UI/ToolbarMode/Applications/Calc">
  <prop oor:name="Active" oor:op="fuse"><value>notebookbar.ui</value></prop>
</item>
<item oor:path="/org.openoffice.Office.UI/ToolbarMode/Applications/Impress">
  <prop oor:name="Active" oor:op="fuse"><value>notebookbar.ui</value></prop>
</item>
<item oor:path="/org.openoffice.Office.UI/ToolbarMode/Applications/Draw">
  <prop oor:name="Active" oor:op="fuse"><value>notebookbar.ui</value></prop>
</item>
<item oor:path="/org.openoffice.Office.UI/ToolbarMode/Applications/Writer/Modes/Tabbed">
  <prop oor:name="HasMenubar" oor:op="fuse"><value>false</value></prop>
</item>
```

Repeat the final `Modes/Tabbed` item for Calc, Impress, and Draw only if SP+ wants the value explicit. It is already false by default in the 26.2 `ToolbarMode.xcu` data. The important setting is each application's `Active` property. The root `ActiveWriter`, `ActiveCalc`, etc. properties in the shipped file select the NotebookBar implementation file; they are not a substitute for the per-application mode selection.

A configuration-extension component-data equivalent starts as:

```xml
<oor:component-data oor:name="ToolbarMode" oor:package="org.openoffice.Office"
    xmlns:oor="http://openoffice.org/2001/registry"
    xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <node oor:name="Applications">
    <node oor:name="Writer">
      <prop oor:name="Active" oor:type="xs:string"><value>notebookbar.ui</value></prop>
    </node>
    <!-- repeat for Calc, Impress, Draw -->
  </node>
</oor:component-data>
```

The public source for `ToolbarMode.xcu` contains the mode definitions and the public schema describes `Active` as the currently used mode. The exact default should be confirmed in a clean 26.2 QA profile after packaging because NotebookBar contents continue to evolve between LibreOffice releases.

## 2. Icon theme: Colibre

**Confirmed:** Colibre is the Microsoft-oriented choice. The Document Foundation's LibreOffice 6.1 announcement says Colibre was based on Microsoft's icon design guidelines, used Microsoft's Office color scheme, and was intended to be visually appealing to users coming from Microsoft. It was introduced in 6.1 and is no longer a new/experimental theme. On KDE, automatic desktop selection may choose Breeze, so SP+ should set Colibre explicitly rather than relying on `auto`.

### Exact key

```xml
<item oor:path="/org.openoffice.Office.Common/Misc">
  <prop oor:name="SymbolStyle" oor:op="fuse"><value>colibre</value></prop>
</item>
```

The 26.2 schema path is:

```text
/org.openoffice.Office.Common/Misc/SymbolStyle
```

Type is `xs:string`; schema default is `auto`; value `colibre` is the explicit light Colibre theme. `colibre_dark` is a different choice and would be less like the normal Office light appearance. `colibre_svg` availability depends on the installed theme assets.

The replacement icon files must exist in the installed LibreOffice package. Verify in the image/package QA environment by checking the Fedora LibreOffice style package and by observing the icon theme list; do not assume a profile key can create a missing theme.

## 3. Default Office save formats

LibreOffice's 26.2 factory schema places the setting at:

```text
/org.openoffice.Setup/Office/Factories/<factory>/ooSetupFactoryDefaultFilter
```

The three factory identifiers needed here are:

```text
com.sun.star.text.TextDocument
com.sun.star.sheet.SpreadsheetDocument
com.sun.star.presentation.PresentationDocument
```

### Recommended 26.2 values

The 26.2 filter fragments identify the modern OOXML filters as follows:

| Module | Exact key path suffix | Value to set | UI name in the 26.2 filter fragment | Extension |
|---|---|---|---|---|
| Writer | `...Factory['com.sun.star.text.TextDocument']/ooSetupFactoryDefaultFilter` | `Office Open XML Text` | `Word 2010–365 Document` | `.docx` |
| Calc | `...Factory['com.sun.star.sheet.SpreadsheetDocument']/ooSetupFactoryDefaultFilter` | `Calc Office Open XML` | `Excel 2010–365 Spreadsheet` | `.xlsx` |
| Impress | `...Factory['com.sun.star.presentation.PresentationDocument']/ooSetupFactoryDefaultFilter` | `Impress Office Open XML` | `Office Open XML Presentation` | `.pptx` |

Exact profile entries:

```xml
<item oor:path="/org.openoffice.Setup/Office/Factories/org.openoffice.Setup:Factory['com.sun.star.text.TextDocument']">
  <prop oor:name="ooSetupFactoryDefaultFilter" oor:op="fuse"><value>Office Open XML Text</value></prop>
</item>
<item oor:path="/org.openoffice.Setup/Office/Factories/org.openoffice.Setup:Factory['com.sun.star.sheet.SpreadsheetDocument']">
  <prop oor:name="ooSetupFactoryDefaultFilter" oor:op="fuse"><value>Calc Office Open XML</value></prop>
</item>
<item oor:path="/org.openoffice.Setup/Office/Factories/org.openoffice.Setup:Factory['com.sun.star.presentation.PresentationDocument']">
  <prop oor:name="ooSetupFactoryDefaultFilter" oor:op="fuse"><value>Impress Office Open XML</value></prop>
</item>
```

The 26.2 tree also contains these older, still valid OOXML filter names:

```text
MS Word 2007 XML
Calc MS Excel 2007 XML
Impress MS PowerPoint 2007 XML
```

Those produce `.docx`, `.xlsx`, and `.pptx`, but the modern values above are the less ambiguous choice for documents exchanged with current Office. Do not use the internal type names (`writer_OOXML`, `Office Open XML Spreadsheet`, etc.) as the factory default value; the factory property expects the registered **filter name**.

Do not change Base, Draw, or Math to these values. Their normal factory defaults in 26.2 are respectively `StarOffice XML (Base)`, `draw8`, and `math8`; there is no single Office equivalent for those document types.

### Warning dialog

The exact property is:

```text
/org.openoffice.Office.Common/Save/Document/WarnAlienFormat
```

Type is boolean and the 26.2 schema default is `true`. LibreOffice's Help says this warning appears when saving outside ODF or outside the configured default format.

For an Office-exchange appliance, the usability choice is:

```xml
<item oor:path="/org.openoffice.Office.Common/Save/Document">
  <prop oor:name="WarnAlienFormat" oor:op="fuse"><value>false</value></prop>
</item>
```

This removes the nag, but it also removes the warning that can prevent silent loss of unsupported ODF/OOXML features. That is a real downside. If SP+ wants LibreOffice's safety warning, leave it `true`; setting the defaults to OOXML does not require disabling the warning. The recommendation to set it false is therefore conditional on SP+ deciding that routine client exchange is more important than the warning.

The official LibreOffice guides still recommend ODF as the safest default for preserving LibreOffice features. OOXML defaults are an intentional interoperability trade: complex fields, tracked changes, styles, formulas, macros, fonts, animations, and layout can differ on round-trip. Macro-enabled `.docm/.xlsm/.pptm` is not covered by the ordinary `.docx/.xlsx/.pptx` defaults.

## 4. Keyboard shortcuts

There is no confirmed built-in "Microsoft Office shortcuts" preset in LibreOffice 26.2 documentation. The official mechanism is:

```text
Tools > Customize > Keyboard
```

The dialog can save and load a keyboard configuration as a `.cfg` file, and the official 26.2 guide says the loaded configuration replaces the existing keyboard configuration and LibreOffice should be restarted afterward. That is a whole shortcut configuration, not a simple registry boolean.

LibreOffice already matches Office for the high-frequency operations most advisors use:

```text
Ctrl+O  Open       Ctrl+S  Save       Ctrl+P  Print
Ctrl+C  Copy       Ctrl+X  Cut        Ctrl+V  Paste
Ctrl+Z  Undo       Ctrl+B  Bold       Ctrl+I  Italic
Ctrl+U  Underline  Ctrl+F  Find       Ctrl+H  Find/Replace
```

Module-specific differences exist, particularly in Calc. A complete third-party Word/Excel/PowerPoint shortcut `.cfg` set is not an official LibreOffice artifact and was not treated as verified evidence here. Shipping one would risk collisions, overwriting useful defaults, and confusing shortcuts that differ by module. Keep the built-ins until SP+ has a tested, owned shortcut map.

For teams that later create their own map, the underlying configuration component is `org.openoffice.Office/Accelerators`; global and module-specific entries use command URLs such as `.uno:Copy`. This is an implementation detail, not a supported one-key Office compatibility mode. The safe deployment route is to generate and test a `.cfg` with the official Customize dialog, then import it per user. It belongs in the user layer, not in an arbitrary `.xcd` edit.

## 5. Fonts and substitution

### Install compatible fonts in the image

Calibri, Cambria, and Times New Roman are Microsoft fonts. The Document Foundation's font guidance notes that proprietary Microsoft fonts cannot simply be redistributed with LibreOffice; use them only where SP+ has the appropriate license. For an unlicensed/open image, install these open alternatives as system fonts:

```text
Calibri          -> Carlito
Cambria          -> Caladea
Times New Roman  -> Tinos
```

The alternatives are designed to be metrically compatible or visually similar, but they do not guarantee identical page breaks. Installing font files is an OS/image action, not a LibreOffice registry setting. Verify in the image QA environment:

```bash
fc-match Carlito
fc-match Caladea
fc-match Tinos
```

Expected result is each named family, not a fallback such as DejaVu or Liberation.

### Font replacement table

The 26.2 schema paths are:

```text
/org.openoffice.Office.Common/Font/Substitution/Replacement
/org.openoffice.Office.Common/Font/Substitution/FontPairs/<entry>/ReplaceFont
/org.openoffice.Office.Common/Font/Substitution/FontPairs/<entry>/SubstituteFont
/org.openoffice.Office.Common/Font/Substitution/FontPairs/<entry>/Always
/org.openoffice.Office.Common/Font/Substitution/FontPairs/<entry>/OnScreenOnly
```

`Replacement` defaults false. `Always` and `OnScreenOnly` default false. With `Always=false` and `OnScreenOnly=false`, the mapping is used on screen and when printing when the requested font is unavailable. That is the least surprising deployment choice: if a licensed exact font is installed, LibreOffice can use it; if it is missing, the open metric-compatible font is used for display and print.

Use this in the user profile:

```xml
<item oor:path="/org.openoffice.Office.Common/Font/Substitution">
  <prop oor:name="Replacement" oor:op="fuse"><value>true</value></prop>
</item>
<item oor:path="/org.openoffice.Office.Common/Font/Substitution/FontPairs">
  <node oor:name="_0" oor:op="replace">
    <prop oor:name="ReplaceFont" oor:op="fuse"><value>Calibri</value></prop>
    <prop oor:name="SubstituteFont" oor:op="fuse"><value>Carlito</value></prop>
    <prop oor:name="Always" oor:op="fuse"><value>false</value></prop>
    <prop oor:name="OnScreenOnly" oor:op="fuse"><value>false</value></prop>
  </node>
  <node oor:name="_1" oor:op="replace">
    <prop oor:name="ReplaceFont" oor:op="fuse"><value>Cambria</value></prop>
    <prop oor:name="SubstituteFont" oor:op="fuse"><value>Caladea</value></prop>
    <prop oor:name="Always" oor:op="fuse"><value>false</value></prop>
    <prop oor:name="OnScreenOnly" oor:op="fuse"><value>false</value></prop>
  </node>
  <node oor:name="_2" oor:op="replace">
    <prop oor:name="ReplaceFont" oor:op="fuse"><value>Times New Roman</value></prop>
    <prop oor:name="SubstituteFont" oor:op="fuse"><value>Tinos</value></prop>
    <prop oor:name="Always" oor:op="fuse"><value>false</value></prop>
    <prop oor:name="OnScreenOnly" oor:op="fuse"><value>false</value></prop>
  </node>
</item>
```

The `_0`/`_1`/`_2` entry naming and the exact XML conversion are corroborated by an old OpenOffice forum example; that example is **unverified for its 2011 product version**, while the paths and field names are confirmed by the current 26.2 schema. The current official Help confirms the meaning of `Always` and `Screen only`.

Do not set `Always=true` unless SP+ specifically wants to replace even a legitimately installed Microsoft font. Do not set `OnScreenOnly=true` if printed client correspondence must match the screen.

### New Writer documents

Font substitution affects how existing documents render; it does not change the font name recorded in the document. New Writer document defaults are a separate setting:

```text
/org.openoffice.Office.Writer/DefaultFont/Standard
/org.openoffice.Office.Writer/DefaultFont/Heading
/org.openoffice.Office.Writer/DefaultFont/List
/org.openoffice.Office.Writer/DefaultFont/Caption
/org.openoffice.Office.Writer/DefaultFont/Index
```

The corresponding `*Height` values are `xs:int` values in hundredths of a millimetre (`388` is approximately 11 pt; `423` is approximately 12 pt). Font names can be seeded without changing the established size defaults:

```xml
<item oor:path="/org.openoffice.Office.Writer/DefaultFont">
  <prop oor:name="Standard" oor:op="fuse"><value>Carlito</value></prop>
  <prop oor:name="Heading" oor:op="fuse"><value>Caladea</value></prop>
  <prop oor:name="List" oor:op="fuse"><value>Carlito</value></prop>
  <prop oor:name="Caption" oor:op="fuse"><value>Carlito</value></prop>
  <prop oor:name="Index" oor:op="fuse"><value>Carlito</value></prop>
</item>
```

This controls Basic Fonts for new Writer documents when a default template does not override the styles. A default `.ott` template has precedence for document styles and is the stronger tool if SP+ wants an exact Word-like theme. That would be a separate template-delivery decision, not a reason to falsify the global font-substitution key.

## 6. Start Center appearance and recent documents

The current Start Center appears when no document is open. Official Help describes its two panes: create/open buttons on the left, recent document thumbnails and templates on the right. This is already close to the Office start page concept.

There is no reliable current configuration key found for "always show Start Center" or "never show Start Center". Do not invent a `ShowStartCenter` key. The Start Center's documented useful controls are the recent-document history:

```text
/org.openoffice.Office.Common/History/PickListSize
/org.openoffice.Office.Common/History/ShowCurrentModuleOnly
```

The 26.2 schema defaults are `25` and `true`. For a suite-wide Office-like recent list, use:

```xml
<item oor:path="/org.openoffice.Office.Common/History">
  <prop oor:name="PickListSize" oor:op="fuse"><value>25</value></prop>
  <prop oor:name="ShowCurrentModuleOnly" oor:op="fuse"><value>false</value></prop>
</item>
```

`PickListSize` accepts 0–100. Setting it to 25 preserves the standard useful history; setting it to 0 would make the Start Center look empty and is not recommended for these advisors. The Start Center itself will have no history until the advisor opens files.

Optional first-run noise reduction:

```xml
<item oor:path="/org.openoffice.Office.Common/Misc">
  <prop oor:name="ShowDonation" oor:op="fuse"><value>false</value></prop>
  <prop oor:name="ShowTipOfTheDay" oor:op="fuse"><value>false</value></prop>
</item>
```

These exact keys default true in 26.2. Turning them off removes support/donation and tip prompts; that reduces distraction but also removes potentially useful onboarding material. Treat this as optional, not part of the Office-compatibility requirement.

The schema also exposes Start Center thumbnail background/text color values under `/org.openoffice.Office.Common/Help/StartCenter/`, but changing raw color integers is theme-sensitive and has no demonstrated Office-compatibility benefit. Leave them at theme defaults.

## Verification plan for the next SP+ build

Do not run this on the research host. Run it in the disposable LibreOffice QA environment after the image/configuration is built:

1. Confirm package version:

   ```bash
   libreoffice --version
   ```

   Expected major/minor: 26.2 for the Fedora 44 package line.

2. Confirm the seeded XML is well formed without opening LibreOffice:

   ```bash
   xmllint --noout /etc/skel/.config/libreoffice/4/user/registrymodifications.xcu
   ```

3. Confirm the values are present:

   ```bash
   grep -F 'notebookbar.ui' /etc/skel/.config/libreoffice/4/user/registrymodifications.xcu
   grep -F 'SymbolStyle' /etc/skel/.config/libreoffice/4/user/registrymodifications.xcu
   grep -F 'WarnAlienFormat' /etc/skel/.config/libreoffice/4/user/registrymodifications.xcu
   grep -F 'ooSetupFactoryDefaultFilter' /etc/skel/.config/libreoffice/4/user/registrymodifications.xcu
   ```

4. Create a genuinely new test user from `/etc/skel`, open Writer, Calc, Impress, and Draw, and observe **Tabbed** in each. Base and Math should remain non-NotebookBar.

5. In Tools > Options, verify Colibre, the Writer Basic Fonts values, and the Fonts replacement table. Open a client-like DOCX containing Calibri/Cambria/Times New Roman and compare screen and print/PDF output. A `fc-match` success alone proves only that the OS font is installed, not that LibreOffice applied the replacement table.

6. In each of Writer/Calc/Impress, create a blank document, use Save As, and verify the selected default type is Word 2010–365 `.docx`, Excel 2010–365 `.xlsx`, and PowerPoint/Office Open XML `.pptx`. Save and inspect the extension; then reopen the files in LibreOffice. Test in Microsoft Office or an independent OOXML validator before release.

7. Test the warning decision separately. If `WarnAlienFormat=false`, saving in a foreign format must not show the warning; record that the protection has intentionally been removed. If retained true, confirm the warning appears when saving outside the chosen default/ODF formats.

8. With all documents closed, verify Start Center recent thumbnails include files opened by more than one module and that the normal 25-item history is retained.

9. Check the common shortcuts and run a module-specific shortcut test. Do not accept a third-party `.cfg` as an Office-compatible preset without a written mapping and collision test.

## Evidence and citations

Primary/current sources:

* Fedora Packages, LibreOffice Fedora 44 package listing: <https://packages.fedoraproject.org/pkgs/libreoffice/libreoffice/> (the Fedora 44 listing currently reports 26.2.5.2-1.fc44; package metadata can change).
* LibreOffice 26.2 NotebookBar Help: <https://help.libreoffice.org/26.2/en-US/text/shared/01/notebook_bar.html>
* LibreOffice core 26.2 `ToolbarMode.xcu`: <https://raw.githubusercontent.com/LibreOffice/core/libreoffice-26-2/officecfg/registry/data/org/openoffice/Office/UI/ToolbarMode.xcu>
* LibreOffice core 26.2 ToolbarMode schema: <https://raw.githubusercontent.com/LibreOffice/core/libreoffice-26-2/officecfg/registry/schema/org/openoffice/Office/UI/ToolbarMode.xcs>
* LibreOffice core 26.2 Common schema (save warning, icon theme, history, substitution): <https://raw.githubusercontent.com/LibreOffice/core/libreoffice-26-2/officecfg/registry/schema/org/openoffice/Office/Common.xcs>
* LibreOffice core 26.2 Writer schema (Basic Fonts): <https://raw.githubusercontent.com/LibreOffice/core/libreoffice-26-2/officecfg/registry/schema/org/openoffice/Office/Writer.xcs>
* LibreOffice core 26.2 setup defaults/factory schema: <https://raw.githubusercontent.com/LibreOffice/core/libreoffice-26-2/officecfg/registry/data/org/openoffice/Setup.xcu> and <https://raw.githubusercontent.com/LibreOffice/core/libreoffice-26-2/officecfg/registry/schema/org/openoffice/Setup.xcs>
* LibreOffice core 26.2 modern OOXML filter fragments: <https://raw.githubusercontent.com/LibreOffice/core/libreoffice-26-2/filter/source/config/fragments/filters/OOXML_Text.xcu>, <https://raw.githubusercontent.com/LibreOffice/core/libreoffice-26-2/filter/source/config/fragments/filters/calc_OOXML.xcu>, and <https://raw.githubusercontent.com/LibreOffice/core/libreoffice-26-2/filter/source/config/fragments/filters/impress_OOXML.xcu>
* LibreOffice 26.2 save-format Help: <https://help.libreoffice.org/25.2/en-US/text/shared/optionen/01010200.html> (the page documents the setting and warning; the page URL is version 25.2 but the setting remains in the 26.2 schema).
* LibreOffice 26.2 user customization/keyboard guide: <https://books.libreoffice.org/en/GS262/GS26213-CustomizingLO.html>
* LibreOffice 26.2 Start Center Help: <https://help.libreoffice.org/26.2/en-US/text/shared/guide/startcenter.html>
* LibreOffice core 26.2 fallback font data: <https://raw.githubusercontent.com/LibreOffice/core/libreoffice-26-2/officecfg/registry/data/org/openoffice/VCL.xcu>
* LibreOffice configuration-extension guide, Document Foundation wiki PDF: <https://wiki.documentfoundation.org/images/b/b0/LibreOffice_config_extension_writing.pdf>

Official/authoritative supporting sources:

* The Document Foundation, LibreOffice 6.1 release announcement (Colibre's Microsoft icon guidelines and color scheme): <https://blog.documentfoundation.org/blog/2018/08/08/libreoffice-6-1/>
* The Document Foundation, replacing Microsoft fonts (metric-compatible open-font examples): <https://blog.documentfoundation.org/blog/2020/09/08/libreoffice-tt-replacing-microsoft-fonts/>
* LibreOffice official font-replacement Help: <https://help.libreoffice.org/latest/en-US/text/shared/optionen/01010700.html>
* LibreOffice official Basic Fonts Help: <https://help.libreoffice.org/latest/en-US/text/shared/optionen/01040300.html>
* LibreOffice official keyboard Help: <https://help.libreoffice.org/latest/en-US/text/shared/guide/keyboard.html>

Unverified/old supporting source:

* OpenOffice forum example showing `FontPairs/_0` XML naming: <https://forum.openoffice.org/en/forum/viewtopic.php?t=40827>. It is useful for the historical serialization shape, but it concerns OpenOffice 3.3/LibreOffice 3.4.5 and is not proof of every 26.2 deployment detail.

