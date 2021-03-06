import { DateTime } from 'luxon'
import {
  BaseModel,
  belongsTo,
  column,
  BelongsTo,
  beforeSave,
  afterFind,
  afterFetch,
  manyToMany,
  ManyToMany,
  hasMany,
  HasMany,
} from '@ioc:Adonis/Lucid/Orm'
import FileProvider from 'App/Models/FileProvider'
import UserProfile from 'App/Models/UserProfile'
import { TIMEZONE_DATE_TIME_FORMAT } from 'App/Helpers/utils'
import InvoiceQuotationItem from './InvoiceQuotationItem'
import Company from './Company'

export type FormatAttributes = {
  name: string
  hash: string
  ext: string
  mime: string
  width: number
  height: number
  size: number
  path: string | null
  url: string
}

export type FileFormats = {
  thumbnail: FormatAttributes
  large: FormatAttributes
  medium: FormatAttributes
  small: FormatAttributes
}

export type FileUsageType =
  | 'user_profile_picture'
  | 'company_logo'
  | 'customer_logo'
  | 'product_gallery_image'
  | 'category_header_image'
  | 'invoice_quotation_image'

export default class UploadedFile extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public companyId: string

  @column()
  public name: string

  @column()
  public usageType: FileUsageType

  @column()
  public alternativeText: string

  @column()
  public caption: string

  @column()
  public width: number

  @column()
  public height: number

  @column()
  public formats: FileFormats | string | null

  @column()
  public hash: string

  @column()
  public ext: string

  @column()
  public mime: string

  @column()
  public url: string

  @column()
  public previewUrl: string

  @column()
  public size: number

  @column()
  public fileProviderId: number

  @column()
  public fileProviderMetadata: unknown

  @column()
  public createdBy: string

  @column()
  public updatedBy: string

  @column.dateTime({
    autoCreate: true,
    serialize(value: DateTime) {
      return value ? value.toFormat(TIMEZONE_DATE_TIME_FORMAT) : ''
    },
  })
  public createdAt: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    serialize(value: DateTime) {
      return value ? value.toFormat(TIMEZONE_DATE_TIME_FORMAT) : ''
    },
  })
  public updatedAt: DateTime

  @belongsTo(() => FileProvider)
  public provider: BelongsTo<typeof FileProvider>

  @hasMany(() => UserProfile, {
    foreignKey: 'profilePicture',
    onQuery: (query) => query.where('usage_type', 'user_profile_picture'),
  })
  public userProfilePictures: HasMany<typeof UserProfile>

  @hasMany(() => Company, {
    foreignKey: 'logo',
    onQuery: (query) => query.where('usage_type', 'company_logo'),
  })
  public companyLogos: HasMany<typeof Company>

  @manyToMany(() => InvoiceQuotationItem, {
    pivotTable: 'invoices_quotations_items_files',
    pivotTimestamps: true,
    pivotForeignKey: 'uploaded_file_id',
    pivotRelatedForeignKey: 'invoices_quotations_item_id',
  })
  public invoiceQuotationItems: ManyToMany<typeof InvoiceQuotationItem>

  @beforeSave()
  public static async stringifyFormats(file: UploadedFile) {
    if (file.$dirty.formats && file.formats !== undefined) {
      file.formats = JSON.stringify(file.formats)
    }
  }

  @afterFind()
  public static async parseFormats(file: UploadedFile) {
    file.formats = JSON.parse(file.formats as string)
  }

  @afterFetch()
  public static async parseAllFormats(files: UploadedFile[]) {
    files.map((file) => {
      file.formats = JSON.parse(file.formats as string)
      return file
    })
  }
}
