import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Customer from 'App/Models/Customer'
import CustomerAddress from 'App/Models/CustomerAddress'
import CustomerTitle from 'App/Models/CustomerTitle'
import CustomerAddressValidator from 'App/Validators/CustomerAddressValidator'
import CustomerValidator from 'App/Validators/CustomerValidator'
import { CustomerAddressTypes } from '../types'

export default class CustomersController {
  public async index({ response, requestedCompany, request, bouncer }: HttpContextContract) {
    await bouncer.with('CustomerPolicy').authorize('list', requestedCompany!)

    const {
      page,
      descending,
      perPage,
      sortBy,
      id,
      first_name,
      last_name,
      email,
      phone_number,
      is_corporate,
      created_at,
      updated_at,
    } = request.qs()
    //console.log(search, page, descending, perPage, sortBy)

    const searchQuery = {
      id: id ? id : null,
      first_name: first_name ? first_name : null,
      last_name: last_name ? last_name : null,
      email: email ? email : null,
      phone_number: phone_number ? phone_number : null,
      is_corporate: is_corporate ? is_corporate : null,
      created_at: created_at ? created_at : null,
      updated_at: updated_at ? updated_at : null,
    }

    let subquery = Customer.query()
      .select(
        'id',
        'first_name',
        'last_name',
        'email',
        'phone_number',
        'is_corporate',
        'created_at',
        'updated_at',
        'corporate_has_rep',
        'company_name',
        'company_email'
      )
      .where({ company_id: requestedCompany?.id })

    if (sortBy) {
      subquery = subquery.orderBy(sortBy, descending === 'true' ? 'desc' : 'asc')
    }

    if (searchQuery) {
      subquery.where((query) => {
        for (const param in searchQuery) {
          if (Object.prototype.hasOwnProperty.call(searchQuery, param)) {
            let value = searchQuery[param]
            if (value) {
              if (value === 'true') value = true
              if (value === 'false') value = false

              //console.log(param, value)
              query.where(param, value)
              if (typeof value === 'string') {
                query.orWhere(param, 'like', `%${value}%`)
              }
            }
          }
        }
      })
    }

    const customers = await subquery.paginate(page ? page : 1, perPage ? perPage : 20)

    return response.ok({ data: customers })
  }

  public async store({}: HttpContextContract) {}

  public async show({
    response,
    requestedCompany,
    requestedCustomer,
    bouncer,
  }: HttpContextContract) {
    await bouncer.with('CustomerPolicy').authorize('view', requestedCompany!, requestedCustomer!)

    await requestedCustomer?.load('title')

    return response.ok({ data: requestedCustomer })
  }

  public async showAddresses({
    response,
    requestedCompany,
    requestedCustomer,
    bouncer,
  }: HttpContextContract) {
    await bouncer.with('CustomerPolicy').authorize('view', requestedCompany!, requestedCustomer!)

    const addresses = await Database.from('customer_addresses')
      .select(
        'customer_addresses.address_type',
        'customer_addresses.city',
        'customer_addresses.created_at',
        'customer_addresses.id',
        'customer_addresses.postal_code',
        'customer_addresses.street_address',
        'customer_addresses.updated_at',
        'countries.name as country',
        'states.name as state'
      )
      .leftJoin('countries', (query) => {
        query.on('countries.id', '=', 'customer_addresses.country_id')
      })
      .leftJoin('states', (query) => {
        query.on('states.id', '=', 'customer_addresses.state_id')
      })
      .where('customer_addresses.customer_id', requestedCustomer?.id!)

    return response.ok({ data: addresses })
  }

  public async showAddress({
    response,
    requestedCompany,
    requestedCustomer,
    bouncer,
    params,
  }: HttpContextContract) {
    await bouncer.with('CustomerPolicy').authorize('view', requestedCompany!, requestedCustomer!)

    const { customer_address_id } = params
    if (!customer_address_id)
      return response.badRequest({ message: 'No Customer Address was specified' })

    await requestedCustomer?.load('addresses', (addressesQuery) => {
      addressesQuery.where('id', customer_address_id)
      addressesQuery.preload('addressCountry', (countryQuery) => countryQuery.select('id', 'name'))
      addressesQuery.preload('addressState', (stateQuery) => stateQuery.select('id', 'name'))
    })

    const address = requestedCustomer?.addresses

    return response.ok({ data: address?.[0] ?? {} })
  }

  public async update({
    response,
    requestedCompany,
    requestedCustomer,
    request,
    bouncer,
  }: HttpContextContract) {
    await request.validate(CustomerValidator)

    await bouncer.with('CustomerPolicy').authorize('edit', requestedCompany!, requestedCustomer!)

    const {
      title,
      first_name,
      last_name,
      middle_name,
      email,
      phone_number,
      is_corporate,
      corporate_has_rep,
      company_name,
      company_phone,
      company_email,
    } = request.body()

    requestedCustomer?.merge({
      customerTitleId: title,
      firstName: first_name,
      lastName: last_name,
      middleName: middle_name,
      email,
      phoneNumber: phone_number,
      isCorporate: is_corporate,
      corporateHasRep: corporate_has_rep,
      companyName: company_name,
      companyPhone: company_phone,
      companyEmail: company_email,
    })
    await requestedCustomer?.save()

    return response.created({ data: requestedCustomer?.id })
  }

  public async updateAddress({
    response,
    requestedCompany,
    requestedCustomer,
    bouncer,
    params,
    request,
  }: HttpContextContract) {
    await request.validate(CustomerAddressValidator)

    await bouncer.with('CustomerPolicy').authorize('edit', requestedCompany!, requestedCustomer!)

    const { customer_address_id } = params
    if (!customer_address_id) {
      return response.badRequest({ message: 'No Customer Address was specified' })
    }
    const { address, lga, postal_code, state, country, type } = request.body()

    const editedAddress = await CustomerAddress.findOrFail(customer_address_id)
    editedAddress.merge({
      addressType: type,
      streetAddress: address,
      city: lga,
      countryId: country,
      stateId: state,
      postalCode: postal_code,
    })
    await editedAddress.save()

    return response.ok({ data: editedAddress.id })
  }

  public async storeAddress({
    response,
    requestedCompany,
    requestedCustomer,
    bouncer,
    request,
  }: HttpContextContract) {
    await request.validate(CustomerAddressValidator)

    // This is part of the editing operation for the customer
    await bouncer.with('CustomerPolicy').authorize('edit', requestedCompany!, requestedCustomer!)

    const { address, lga, postal_code, state, country, type } = request.body()

    if (type === 'both') {
      const addressTypes: Array<CustomerAddressTypes> = ['shipping_address', 'billing_address']
      for (let i = 0; i < addressTypes.length - 1; i++) {
        const addressType = addressTypes[i]

        await requestedCustomer?.related('addresses').create({
          addressType,
          streetAddress: address,
          city: lga,
          countryId: country,
          stateId: state,
          postalCode: postal_code,
        })
      }
    } else {
      await requestedCustomer?.related('addresses').create({
        addressType: type,
        streetAddress: address,
        city: lga,
        countryId: country,
        stateId: state,
        postalCode: postal_code,
      })
    }

    return response.created()
  }

  public async destroy({
    response,
    requestedCompany,
    requestedCustomer,
    bouncer,
  }: HttpContextContract) {
    await bouncer.with('CustomerPolicy').authorize('delete', requestedCompany!, requestedCustomer!)

    await requestedCustomer?.delete()

    return response.ok({
      message: 'Customer was deleted successfully.',
      data: requestedCustomer?.id,
    })
  }

  public async customerTitlesForSelect({ response, isGlobalUser, authRole }: HttpContextContract) {
    const titles = await CustomerTitle.query()
      .orderBy('name', 'asc')
      .select(...['id', 'name'])

    const transformedTitles = titles.map((role) => {
      return {
        label: role.name,
        value: role.id,
      }
    })

    return response.ok({
      data: transformedTitles,
    })
  }
}
