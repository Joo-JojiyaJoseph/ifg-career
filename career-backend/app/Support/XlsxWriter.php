<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;
use RuntimeException;
use ZipArchive;

/**
 * Writes a single-sheet workbook. maatwebsite/excel cannot be installed on PHP 8.5
 * because phpoffice/phpspreadsheet requires PHP below 8.5.
 */
class XlsxWriter
{
    /**
     * @param  list<string>  $headings
     * @param  list<list<scalar|null>>  $rows
     */
    public function store(array $headings, array $rows, string $path, string $disk = 'private'): void
    {
        $temporary = tempnam(sys_get_temp_dir(), 'xlsx');

        if ($temporary === false) {
            throw new RuntimeException('The export file could not be created.');
        }

        $zip = new ZipArchive;
        if ($zip->open($temporary, ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('The export file could not be created.');
        }

        $zip->addFromString('[Content_Types].xml', $this->contentTypes());
        $zip->addFromString('_rels/.rels', $this->rootRels());
        $zip->addFromString('xl/workbook.xml', $this->workbook());
        $zip->addFromString('xl/_rels/workbook.xml.rels', $this->workbookRels());
        $zip->addFromString('xl/worksheets/sheet1.xml', $this->sheet($headings, $rows));
        $zip->close();

        $stream = fopen($temporary, 'rb');
        if ($stream === false) {
            @unlink($temporary);
            throw new RuntimeException('The export file could not be created.');
        }

        Storage::disk($disk)->put($path, $stream);
        fclose($stream);
        @unlink($temporary);
    }

    /**
     * @param  list<string>  $headings
     * @param  list<list<scalar|null>>  $rows
     */
    private function sheet(array $headings, array $rows): string
    {
        $all = array_merge([$headings], $rows);
        $lastColumn = $this->column(max(count($headings), 1));
        $lastRow = max(count($all), 1);
        $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<dimension ref="A1:'.$lastColumn.$lastRow.'"/>'
            .'<sheetData>';

        foreach ($all as $index => $row) {
            $number = $index + 1;
            $xml .= '<row r="'.$number.'">';
            foreach (array_values($row) as $column => $value) {
                $reference = $this->column($column + 1).$number;
                $text = htmlspecialchars((string) ($value ?? ''), ENT_QUOTES | ENT_XML1, 'UTF-8');
                $xml .= '<c r="'.$reference.'" t="inlineStr"><is><t xml:space="preserve">'.$text.'</t></is></c>';
            }
            $xml .= '</row>';
        }

        return $xml.'</sheetData></worksheet>';
    }

    private function column(int $index): string
    {
        $name = '';
        while ($index > 0) {
            $index--;
            $name = chr(65 + ($index % 26)).$name;
            $index = intdiv($index, 26);
        }

        return $name;
    }

    private function contentTypes(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            .'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            .'</Types>';
    }

    private function rootRels(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            .'</Relationships>';
    }

    private function workbook(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            .'<sheets><sheet name="Export" sheetId="1" r:id="rId1"/></sheets></workbook>';
    }

    private function workbookRels(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            .'</Relationships>';
    }
}
