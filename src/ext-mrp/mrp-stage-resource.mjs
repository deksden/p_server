import { v4 as uuid } from 'uuid'

export const MrpStageResource = (app) => {
  return {
    name: 'MrpStageResource',
    caption: 'Нормы расхода',
    description: 'Нормы расхода ресурсов на этапе производства',
    seedFileName: 'mrp-stage-resource.json',
    icon: 'BarChart',
    props: [
      {
        name: 'id',
        type: 'id',
        caption: 'Id',
        description: 'Идентификатор',
        format: 'uuid',
        default: () => uuid()
      },
      {
        name: 'stage',
        type: 'ref',
        model: 'MrpStage',
        caption: 'Этап',
        description: 'Ссылка на этап производства, для которого уазана норма расхода',
        default: null
      },
      {
        name: 'resource',
        type: 'ref',
        model: 'MrpResource',
        caption: 'Ресурс',
        description: 'Ссылка на ресурс, для которого указана норма расхода на этапе производства',
        default: null
      },
      {
        name: 'qnt',
        type: 'decimal',
        caption: 'Количество',
        description: 'Количество потребляемого ресурса на этом этапе, в отношении к resource.baseQnt',
        precision: 16,
        scale: 4,
        format: '',
        default: 0
      },
      {
        name: 'price',
        type: 'decimal',
        caption: 'Цена',
        description: 'Плановая стоимость единицы ресурса',
        precision: 12,
        scale: 2,
        format: '',
        default: 0
      }
    ]
  }
}
