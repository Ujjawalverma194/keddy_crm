const { createSequelizeRepository } = require('../utils/sequelizeRepository');

const {
  CompanyFinanceSettings: FinanceModel,
  CompanyBankAccount: BankModel,
  Invoice: InvoiceModel,
  InvoicePayment: PaymentModel,
} = require('./sequelize/init');

module.exports = {
  CompanyFinanceSettings: createSequelizeRepository(FinanceModel),
  CompanyBankAccount: createSequelizeRepository(BankModel),
  Invoice: createSequelizeRepository(InvoiceModel),
  InvoicePayment: createSequelizeRepository(PaymentModel),
};