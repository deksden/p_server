import moment from 'moment-business-days'


/** Добавить к дате указанное количество дней с учетом признака isWorkingDays
 *
 * @param date {object}: любой moment-like объект, будет приведен к moment
 * @param daysCount {number}: количество дней; если `null`, то вернуть date
 * @param isWorkingDays {boolean}: признак, что указываем в рабочих днях; если null - то в календарных
 * @return {moment} возвращает moment объект с новой датой
 */
export const dateAddDays = function (date, daysCount, isWorkingDays) {
  let aDate = moment(date)
  if (!daysCount) {
    return aDate
  }
  if (isWorkingDays) {
    aDate = aDate.businessAdd(daysCount)
  } else {
    aDate = aDate.add(daysCount, 'days')
  }
  return aDate
}

/** Уменьшить указанную дату на указанное количество дней с учетом признака isWorkingDays
 *
 * @param date {object}: любой moment-like объект, будет приведен к moment
 * @param daysCount {number}: количество дней; если `null`, то вернуть date
 * @param isWorkingDays {boolean}: признак, что указываем в рабочих днях; если null - то в календарных
 * @return {moment} возвращает moment объект с новой датой
 */
export const dateSubtractDays = function (date, daysCount, isWorkingDays) {
  let aDate = moment(date)
  if (!daysCount) {
    return aDate
  }
  if (isWorkingDays) {
    aDate = aDate.businessSubtract(daysCount)
  } else {
    aDate = aDate.subtract(daysCount, 'days')
  }
  return aDate
}

/** сделать из date объект moment и вернуть его
 *
 * @param date {string|moment}: дата для перевода в moment, может быть строкой или уже объектом moment
 * @param format {string}: формат для перевода даты, если она является строкой; если NULL то будем использовать DD-MM-YYYY
 * @return {moment} возвращаем в любом случае moment
 */
export const makeMoment = function (date, format) {
  const aDateFormat = format | 'DD-MM-YYYY'

  // переводим формат переменной даты в объект moment
  if (typeof date === 'string') {
    return moment.utc(date, aDateFormat)
  } else {
    return moment(date)
  }
}

export const printMoment = function (date, format) {
  const aDateFormat = format | 'DD-MM-YYYY'

  if (typeof date === 'string') {
    return moment.utc(date, aDateFormat).format(aDateFormat)
  } else {
    return moment(date).format(aDateFormat)
  }
}
