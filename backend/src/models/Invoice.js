const { wrapModel } = require('../utils/modelWrapper');

const {
  CompanyFinanceSettings: FinanceModel,
  CompanyBankAccount: BankModel,
  Invoice: InvoiceModel,
  InvoicePayment: PaymentModel,
} = require('./sequelize/init');

module.exports = {
  CompanyFinanceSettings: wrapModel(FinanceModel),
  CompanyBankAccount: wrapModel(BankModel),
  Invoice: wrapModel(InvoiceModel),
  InvoicePayment: wrapModel(PaymentModel),
};