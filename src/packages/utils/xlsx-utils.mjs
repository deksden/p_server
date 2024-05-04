import XLSX from 'xlsx-js-style'
import _ from 'lodash'

export const theme = {
  H1: {
    font: {
      name: 'Tahoma',
      sz: 16,
      bold: true
      // color: { rgb: 'FF0000' }
    },
    alignment : {
      horizontal: 'left',
      wrapText: false
    }
  },
  H2: {
    font: {
      name: 'Tahoma',
      sz: 14,
      bold: true
    },
    alignment : {
      horizontal: 'left',
      wrapText: false
    }
  },
  H3: {
    font: {
      name: 'Tahoma',
      sz: 12,
      bold: true
    },
    alignment : {
      horizontal: 'left',
      wrapText: false
    }
  },
  Normal: {
    font: {
      name: 'Tahoma',
      sz: 10,
      bold: false
    },
    alignment : {
      horizontal: 'left',
      wrapText: false
    }
  },
  THL: { // table header, left cell
    border: {
      top: { style: 'thick' },
      bottom: { style: 'thick' },
      left: { style: 'thick' },
      right: { style: 'thin' }
    },
    font: {
      bold: true
    },
    alignment: {
      horizontal: 'center',
    }
  },
  TH: { // table header, regular cell
    border: {
      top: { style: 'thick' },
      bottom: { style: 'thick' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    },
    font: {
      bold: true
    },
    alignment: {
      horizontal: 'center',
    }
  },
  THR: { // table header, right cell
    border: {
      top: { style: 'thick' },
      bottom: { style: 'thick' },
      left: { style: 'thin' },
      right: { style: 'thick' }
    },
    font: {
      bold: true
    },
    alignment: {
      horizontal: 'center',
    }
  },
  TFRL: { // table first row, left cell
    border: {
      top: { style: 'thick' },
      bottom: { style: 'dotted' },
      left: { style: 'thick' }
    }
  },
  TFR: { // table first row, regular cell
    border: {
      top: { style: 'thick' },
      bottom: { style: 'dotted' }
    }
  },
  TFRR: { // table first row, right cell
    border: {
      top: { style: 'thick' },
      bottom: { style: 'dotted' },
      right: { style: 'thick' }
    }
  },
  TLRL: { // table last row, left cell
    border: {
      top: { style: 'dotted' },
      bottom: { style: 'thick' },
      left: { style: 'thick' }
    }
  },
  TLR: { // table last row, regular cell
    border: {
      top: { style: 'dotted' },
      bottom: { style: 'thick' }
    }
  },
  TLRR: { // table last row, right cell
    border: {
      top: { style: 'dotted' },
      bottom: { style: 'thick' },
      right: { style: 'thick' }
    }
  },
  TRL: { // table (regular) row, left cell
    border: {
      top: { style: 'dotted' },
      bottom: { style: 'dotted' },
      left: { style: 'thick' }
    }
  },
  TR: { // table (regular) row, regular cell
    border: {
      top: { style: 'dotted' },
      bottom: { style: 'dotted' }
    }
  },
  TRR: { // table (regular) row, right cell
    border: {
      top: { style: 'dotted' },
      bottom: { style: 'dotted' },
      right: { style: 'thick' }
    }
  },
  CellBorderFullThick: {
    border: {
      top: { style: 'thick' },
      bottom: { style: 'thick' },
      left: { style: 'thick' },
      right: { style: 'thick' }
    }
  },
  TypeNumber: 'n',
  TypeText: 's',
  TypeBoolean: 'b',
  FormatNumberCurrencyDecimals: '"$"#,##0.00_);\\("$"#,##0.00\\)',
  FormatNumberCurrencyNoDecimals: '"$"#,##0_);\\("$"#,##0\\)',
  FormatNumberDecimals: '#,##0.00',
  FormatNumberNoDecimals: '#,##0',
  FormatNumberPercentDecimals: '#,##0.00%',
  FormatNumberPercentNoDecimals: '#,##0%',
}

export const newSheet = () => XLSX.utils.json_to_sheet([{'':''}])

export const setStyle = (sheet, R, C, style) => {
  const c = getCell(sheet,R, C)
  if (style) {
    c.s = _.assign(c.s, style)
  }
  return c
}

/** добавить строчку заголовков на лист. Строки заголовка будут оформлены соответствующими стилями
 *
 * @param ws {WorkSheet} лист из XLS книги
 * @param R {number} куда добавить заголовок - ряд первой ячейки заголовка
 * @param C {number} куда добавить заголовок - столбец первой ячейки заголовка
 * @param data {Array<string>} ячейки заголовка, массив строк
 * @param theme {Object} тема, которая будет использоваться для оформления ячеек. Ожидаем
 *  объект с ключами THL, TH и THR соответственно для левой ячейки заголовка, остальных ячеек заголовка и
 *  правой ячейки заголовка. Можно передать единственный стиль, тогда он будет применён для всех ячеек.
 *  Если стиль NULL, то будет использован для всех ячеек стиль с толстой рамкой вокруг.
 */
export const setHeader = (ws, R, C, data, theme) => {
  // проверить параметры
  if (!Array.isArray(data)) {
    throw new Error('data should be an array')
  }

  let t = theme
  if (!theme || !theme.THL || !theme.THR || !theme.THR) {
    // если стиль не указан, или передан единственный стиль
    if (!theme) {
      // стиль не передан, определим стиль сами одинаково для всех ячеек,
      // как толстые рамки вокруг всей ячейки:
      t = {}
      t.THL = {
        border: {
          top: { style: 'thick' },
          bottom: { style: 'thick' },
          left: { style: 'thick' },
          right: { style: 'thick' }
        }
      }
    } else {
      // нам передали стиль какой-то стиль, но не в формате ключей ячеек заголовка
      t.THL = theme
    }

    // остальные ячейки сделаем как THL
    t.TH = t.THL
    t.THR = t.THL
  }

  let styleSelector = 'THL'
  let c = null
  for (const [ndx, d] of data.entries()) {
    c = setCell(ws,R, C+ndx, d, theme[styleSelector])
    styleSelector = 'TH'
    if (ndx === data.length-2) {
      styleSelector = 'THR'
    }
  }
}

/** Записать строку таблицы в лист книги XLS
 *
  * @param ws {WorkSheet}
 * @param R {number} строка
 * @param C {number} столбец
 * @param data {Array<string>} массив строк со значениями ячеек
 * @param theme {Object} тема. Может быть темой с ключами для ячеек, темой одной ячейки или NULL.
 * @param rowThemeSelector {string} селектора темы строки таблицы: FR для первого ряда, R для обычного
 * ряда и LR для последней строки
 */
export const setTableRow = (ws, R, C, data, theme, rowThemeSelector) => {
  let t = theme
  if (!theme ||
    !theme.TFRL || !theme.TFR || !theme.TFRR ||
    !theme.TLRL || !theme.TLR || !theme.TLRR ||
    !theme.TRL || !theme.TR || !theme.TRR )
  {
    // если стиль не указан, или передан единственный стиль
    if (!theme) {
      // стиль не передан, определим стиль сами одинаково для всех ячеек,
      // как толстые рамки вокруг всей ячейки:
      t = {}
      t.TFRL = {
        border: {
          top: { style: 'thick' },
          bottom: { style: 'thick' },
          left: { style: 'thick' },
          right: { style: 'thick' }
        }
      }
    } else {
      // нам передали стиль какой-то стиль, но не в формате ключей ячеек заголовка
      t.TFRL = theme
    }

    // остальные ячейки сделаем как TFRL
    t.TFR = t.TFRL
    t.TFRR = t.TFRL
    t.TLRL = t.TFRL
    t.TLR = t.TFRL
    t.TLRR = t.TFRL
    t.TRL = t.TFRL
    t.TR = t.TFRL
    t.TRR = t.TFRL
  }

  let sel = null
  for (const [ndx, d] of data.entries()) {
    // составим селектор для темы
    if (ndx === 0) {
      sel = `T${rowThemeSelector}L`
    } else if (ndx === data.length - 1) {
      sel = `T${rowThemeSelector}R`
    } else {
      sel = `T${rowThemeSelector}`
    }

    setCell(ws, R, C+ndx, d, theme[sel])
  }
}

/** установить ширину указанной колонки
 *
 * @param ws {WorkSheet} лист XLSX
 * @param C {number} номер колонки, начиная с 0, в стиле R1C1
 * @param width {number} ширина колонки
 * @param unit {string} единица измерения ширины: "wch" (по умолчанию, в символах), "wpx" в пикселях,
 * "width" в пикселях
 */
export const setColumnWidth = (ws, C, width, unit='wch') => {
  // создадим объект для хранения метаданных
  if(!ws["!cols"]) ws["!cols"] = [];

  // если ширину этого столбца еще не определяли:
  if(!ws["!cols"][C]) {
    ws["!cols"][C] = {}
    ws["!cols"][C][unit] = width
  } else {
    ws["!cols"][C][unit] = width
  }
}

export const setRowHeight = (ws, R, height, unit = 'hpx') => {
  if(!ws["!rows"]) ws["!rows"] = []
  if(!ws["!rows"][R]) {
    ws["!rows"][R] = {}
    ws["!rows"][R][unit] = height
  } else {
    ws["!rows"][R][unit] = height
  }
}

/** Установить форматирование ячейки:
 *
 * @param ws {WorkSheet} лист XLS
 * @param R {number}
 * @param C {number}
 * @param cell_type {string}
 * @param cellFormat {string} формат ячейки
 * @return {Cell} возвращает ячейку
 */
export const setCellFormat = (ws, R, C, cell_type, cellFormat= null, style = null) => {
  const c = getCell(ws, R,C)
  c.t = cell_type

  if (cellFormat) c.z = cellFormat
  if (style) c.s = style

  return c
}

export const getCell = (sheet, R,  C) => {
  const cell = sheet["!data"] != null ? sheet["!data"]?.[R]?.[C] : sheet[XLSX.utils.encode_cell({r:R, c:C})]

  if (cell) {
    return cell
  } else {
    XLSX.utils.sheet_add_aoa(sheet, [['']], {origin: XLSX.utils.encode_cell({r:R, c:C}) })
    return sheet["!data"] != null ? sheet["!data"]?.[R]?.[C] : sheet[XLSX.utils.encode_cell({r:R, c:C})]
  }
}

/** Установить значение ячейки (и стиль при необходимости)
 *
 * @param sheet {WorkSheet} лист XLSX
 * @param R {number} номер строки
 * @param C {number} номер столбца
 * @param data {string}
 * @param style {Object} (не обязательно) стиль ячейки
 * @return {Cell} возвращает эту ячейку
 */
export const setCell = (sheet, R,  C, data, style = null) => {
  let cell = sheet["!data"] != null ? sheet["!data"]?.[R]?.[C] : sheet[XLSX.utils.encode_cell({r:R, c:C})]

  if (cell) {
    cell.v = data
  } else {
    // такой ячейки еще нет
    // добавим новый объект на страничку и вернем ячейку
    cell = XLSX.utils.sheet_add_aoa(
      sheet,
      [[data]],
      {origin: XLSX.utils.encode_cell({r:R, c:C}) }
    )[XLSX.utils.encode_cell({r:R, c:C})]
  }

  if (style) {
    cell.s = _.assign(cell.s, _.cloneDeep(style))
  }
  return cell
}
