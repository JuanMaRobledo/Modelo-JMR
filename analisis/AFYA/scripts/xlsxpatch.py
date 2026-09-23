"""Minimal in-place cell patcher for .xlsx files.

Edits cell values directly in the sheet XML so charts, images, tables,
validations and styles survive (openpyxl would drop charts/images).
"""
import re
import zipfile
from lxml import etree

NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
RNS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
N = "{%s}" % NS


def col2num(col):
    n = 0
    for ch in col:
        n = n * 26 + (ord(ch) - 64)
    return n


def split_ref(ref):
    m = re.match(r"([A-Z]+)(\d+)$", ref)
    return m.group(1), int(m.group(2))


class Workbook:
    def __init__(self, path):
        self.path = path
        self.zin = zipfile.ZipFile(path)
        self.files = {n: self.zin.read(n) for n in self.zin.namelist()}
        wb = etree.fromstring(self.files["xl/workbook.xml"])
        rels = etree.fromstring(self.files["xl/_rels/workbook.xml.rels"])
        rid2target = {r.get("Id"): r.get("Target") for r in rels}
        self.sheet_paths = {}
        for s in wb.find(N + "sheets"):
            target = rid2target[s.get("{%s}id" % RNS)]
            target = target.lstrip("/")
            if not target.startswith("xl/"):
                target = "xl/" + target
            self.sheet_paths[s.get("name")] = target
        self.trees = {}
        self.log = []

    def _tree(self, sheet):
        p = self.sheet_paths[sheet]
        if p not in self.trees:
            self.trees[p] = etree.fromstring(self.files[p])
        return self.trees[p]

    def _cell(self, sheet, ref):
        root = self._tree(sheet)
        data = root.find(N + "sheetData")
        col, rown = split_ref(ref)
        row = None
        for r in data.findall(N + "row"):
            rn = int(r.get("r"))
            if rn == rown:
                row = r
                break
            if rn > rown:
                row = etree.Element(N + "row", r=str(rown))
                r.addprevious(row)
                break
        if row is None:
            row = etree.SubElement(data, N + "row", r=str(rown))
        cell = None
        for c in row.findall(N + "c"):
            ccol, _ = split_ref(c.get("r"))
            if ccol == col:
                return c
            if col2num(ccol) > col2num(col):
                cell = etree.Element(N + "c", r=ref)
                c.addprevious(cell)
                return cell
        cell = etree.SubElement(row, N + "c", r=ref)
        return cell

    def get(self, sheet, ref):
        c = self._cell(sheet, ref)
        f = c.find(N + "f")
        return etree.tostring(c).decode()

    def set(self, sheet, ref, value):
        """value: number, str (text), None (clear), or str starting with '=' (formula)."""
        c = self._cell(sheet, ref)
        f = c.find(N + "f")
        if f is not None and f.get("t") == "shared" and f.get("ref"):
            raise ValueError(f"{sheet}!{ref} is a shared-formula master; refusing to overwrite")
        for child in list(c):
            c.remove(child)
        for a in ("t",):
            if a in c.attrib:
                del c.attrib[a]
        if value is None:
            pass
        elif isinstance(value, str) and value.startswith("="):
            fe = etree.SubElement(c, N + "f")
            fe.text = value[1:]
        elif isinstance(value, str):
            c.set("t", "inlineStr")
            is_ = etree.SubElement(c, N + "is")
            t = etree.SubElement(is_, N + "t")
            t.text = value
            t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
        else:
            v = etree.SubElement(c, N + "v")
            v.text = repr(float(value)) if not isinstance(value, int) else str(value)
        self.log.append((sheet, ref, value))

    def save(self, out):
        # force full recalculation on open
        wb = etree.fromstring(self.files["xl/workbook.xml"])
        calc = wb.find(N + "calcPr")
        if calc is None:
            calc = etree.SubElement(wb, N + "calcPr")
        calc.set("fullCalcOnLoad", "1")
        self.files["xl/workbook.xml"] = etree.tostring(wb, xml_declaration=True, encoding="UTF-8", standalone=True)
        for p, t in self.trees.items():
            self.files[p] = etree.tostring(t, xml_declaration=True, encoding="UTF-8", standalone=True)
        # drop calcChain (stale after edits)
        self.files.pop("xl/calcChain.xml", None)
        with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
            for info in self.zin.infolist():
                if info.filename in self.files:
                    z.writestr(info, self.files[info.filename])
