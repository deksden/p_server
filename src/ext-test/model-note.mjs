import {v4 as uuid} from 'uuid'

export const Note = (app) => {
  return {
    name: 'Note',
    seedFileName: 'test-note.json',
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
        name: 'caption',
        type: 'text',
        caption: 'Заголовок',
        format: 'text',
        size: 127,
        default: ''
      },
      {
        name: 'description',
        type: 'text',
        caption: 'Примечание',
        format: 'text',
        size: 127,
        default: ''
      },
      {
        name: 'createdAt',
        type: 'datetime',
        caption: 'Дата',
        format: 'DD-MM-YYYY',
        default: null
      },
      {
        name: 'comments',
        type: 'decimal',
        precision: 12,
        scale: 0,
        caption: 'Комментариев',
        format: '',
        default: 0
      }
    ]
  }
}
