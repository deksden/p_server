# FIN schema

## MVP

Минимальная функция:

* начальные остатки
* периодические (еженедельно, ежемесячно) фин операции - выплаты и поступления
* разовые фин операции
* контракты: группы операций - группируются через тэги со значением из списка (контракты)
* добавляем аналитические признаки - счёт БДДС, субсчёт, суб-субсчёт, контрагент, контракт, проект 
* детализация временной шкалы: день, неделя
* отображение платежного календаря на текущую неделю с отображением 
  в pivot table - группировка данных внутри платежного календаря с распределением по указанной 
  степени детальности (день, неделя)
* разные планы
* тэги фин операции разных типов:
  * простые тэги финансовой операции (счета, контракты и тп)
  * иерархические тэги
  * тэги со ссылкой (тип тэга предполагает ссылку на некий обьект в системе)
  * тэги с простым значением
  * тэги со значением из списка

### MVP 2.0

* делаем таблицу "финансовая операция" со всеми текущими полями, которые нам нужны:
  * FIN_ACC: счёт учёта: (справочник), группировка счетов делается отдельно
  * FIN_ORG: организация: (справочник)
  * FIN_ORG: контрагент: (справочник)
  * FIN_PLAN: тип операции: (справочник) факт, план №
  * FIN_CFO: ЦФО / контракт: (справочник)
  
* делаем отчет - платёжный календарь, с компонентом, отображающим сводную таблицу по данным, полученным с сервера
  * FIN_CALENDAR: указываем начальную дату и конечную дату, выводим сводную таблицу по платёжному календарю

### FinOp: Финансовая операция

* id: идентификатор операции
* isPeriodic: (boolean) периодическая операция
* type:
  * 0: нет данных
  * 1: нач остаток
  * 2: поступление
  * 3: выплата
* date: дата операции
* caption: описание
* summ: сумма
* partyId: (-> FinParty.id) наша сторона (юр лицо или компания)
* customerPartyId: (-> FinParty.id) контрагент

* finTags: ([FinTag]) массив тэгов финансовой операции
* planId: идентификатор финансового плана, к которому относится операция (пусто для фактов)
  (?) план - один из тэгов? факт - один из тэгов?
  (?) тип (нач ост/поступление/выплата) - тоже тэг?
  
### FinOpTag: возможные тэги  фин операции

* id: (-> FinOp.id) идентификатор операции
* caption: название тэга
* tagType:
  * 0: не установлено
  * 1: boolean, простой
  * 2: treeRef, иерархический тэг из списка
  * 3: value, тэг с произвольным значением
  * 4: enum, тэг со значением из перечисления
  * 5: ref, тэг со значением из справочника
* tagId: 

### FinOpPeriodic: периодическая финансовая операция

Дополнение к операции, описывающая периодическую операцию: как именно повторяется периодическая операция. 
Дата в этом случае - начало периода, когда операция начинает повторяться.

* id: ссылка на фин операцию
* period: (weekly / monthly)
* num: 
  * для недели - в какой день недели (от 1 до 7)
  * для месяца: в какой день (1-31, 32 - всегда в последний день месяца)
* dateEnd: конец интервала повторения

(? *на будущее*:
* maxDuration: длительность повторения в днях
* maxDurationIsWD: признак, что длительность указана в рабочих днях
)


### FinTagTreeRef: иерархический тэг

* id:
* parentId:

### FinTagEnum: тэг со значением из списка

* id: 
* values:
* captions:

### FinTagRef: тэг со ссылкой на справочник

* id:
* caption
* refType: на какой справочник ссылаемся

### FinTagValue: тэг с произвольным значением


### FinOpTagContract

* id: (-> FinOp.id) ссылка на операцию
* contractId

### FinParty

Контрагент - справочник контрагентов (юридических, физических лиц и тп)

* id: идентификатор контрагента
* caption: название
* type: 
  0: не известно
  1: физическое лицо (Person)
  2: ИП (PersonBiz)
  3: самозанятый (PersonSelfEmp)
  4: юридическое лицо (Company)
  5: банк (Bank)
  (6: брокер, страховая компания, лизинговая) 
  10: иное


### FinBudget: платежный календарь

На входе:

* дата начала периода
* дата окончания периода
* детализация - неделя, день
* список тэгов с параметрами каждого

Фильтрация:

* делаем отбор по датам
* делаем отбор по указанным тегам
* делаем отбор по тэгам, которых быть не должно

Возвращается массив плоских данных:

* (основные поля фин операции)
* (развернутые иерархические тэги)
* (добавить тэги со ссылками на обьекты, добавить указанные поля из обьектов - по пути)
* (добавить value тэги)
* (добавить boolean тэги)


### Считаем остаток на начало периода

Берем дату начала периода. Ищем ближайшую к ней дату внесения начальных остатков. Берем все операции от даты внесения остатков (включительно) до даты начала периода (не включая ее), ссумируем выручку, вычитаем выплаты. Итог - остаток на начало периода.

### Схема расчета экономики

Блоки расчета следующие:

1. Аренда автотранспорта
    1) Выручка: 400-500 тр по месяцу
    2) затраты: 
       * лизинги
       * страховки
2. Реваль
    1) выручка - 1770
    2) выплаты:
      * ГСМ
      * лизинги
      * зп водителям
3. НТС-Шерегеш:
    1) выручка
    2) затраты ежемесячные








