import { v4 as uuid } from 'uuid'

export const MrpStageResource = (app) => {
  return {
    name: 'MrpStageResource',
    seedFileName: 'mrp-stage-resource.json',
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
        description: 'Ссылка на этап',
        default: null
      },
      {
        name: 'resource',
        type: 'ref',
        model: 'MrpResource',
        caption: 'Ресурс',
        description: 'Ссылка на ресурс',
        default: null
      },
      {
        name: 'qnt',
        type: 'decimal',
        caption: 'Количество',
        description: 'Количество потребляемого ресурса на этом этапе',
        precision: 16,
        scale: 4,
        format: '',
        default: 0
      },
    ]
  }
}
