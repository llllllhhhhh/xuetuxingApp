export const COMMERCE_PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  CANCELED: 'canceled',
  REFUNDED: 'refunded',
})

export const COMMERCE_ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  CANCELED: 'canceled',
})

export const REVIEW_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
})

export const TRAVEL_CONTRACT_STATUS = Object.freeze({
  UNSIGNED: 'unsigned',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
})

export const TRAVEL_FULFILLMENT_STATUS = Object.freeze({
  CONTRACT_PENDING: 'contract_pending',
  CONTRACT_REVIEWING: 'contract_reviewing',
  CONTRACT_REJECTED: 'contract_rejected',
  INFO_PENDING: 'info_pending',
  INFO_SUBMITTED: 'info_submitted',
  PICKUP_CONFIRMED: 'pickup_confirmed',
  USER_CONFIRMED: 'user_confirmed',
  QR_ISSUED: 'qr_issued',
  CHECKED_IN: 'checked_in',
  IN_TRIP: 'in_trip',
  COMPLETED: 'completed',
  EXCEPTION: 'exception',
  CANCELLED: 'cancelled',
})

export const commercePaymentStatusText = Object.freeze({
  pending: '待支付',
  paid: '已支付',
  canceled: '已取消',
  cancelled: '已取消',
  refunded: '已退款',
})

export const commerceOrderStatusText = Object.freeze({
  pending: '待支付',
  paid: '已支付',
  canceled: '已取消',
  cancelled: '已取消',
})

export const reviewStatusText = Object.freeze({
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
})

export const travelContractStatusText = Object.freeze({
  unsigned: '合同待签署',
  pending: '合同待审核',
  approved: '合同已通过',
  rejected: '合同被驳回，请重新签署',
})

export const travelFulfillmentStatusText = Object.freeze({
  contract_pending: '等待合同签署',
  contract_reviewing: '合同审核中',
  contract_rejected: '合同已驳回',
  info_pending: '待填写接送信息',
  info_submitted: '平台安排接送中',
  pickup_confirmed: '待确认接送安排',
  user_confirmed: '已确认接送，待核销',
  qr_issued: '核销码已生成',
  checked_in: '已核销',
  in_trip: '行程进行中',
  completed: '订单已完成',
  exception: '订单异常',
  cancelled: '订单已取消',
})

export const statusText = (map, value, fallback = '待处理') => map[value] || fallback
export const paymentStatusName = value => statusText(commercePaymentStatusText, value, value || '待支付')
export const reviewStatusName = value => statusText(reviewStatusText, value, value || '待审核')
export const travelContractStatusName = value => statusText(travelContractStatusText, value, '合同待签署')
export const travelFulfillmentStatusName = value => statusText(travelFulfillmentStatusText, value, '待处理')

export const isTravelFinished = status => [TRAVEL_FULFILLMENT_STATUS.COMPLETED, TRAVEL_FULFILLMENT_STATUS.CANCELLED].includes(status)
export const isTravelLockedForPickupEdit = status => [
  TRAVEL_FULFILLMENT_STATUS.INFO_SUBMITTED,
  TRAVEL_FULFILLMENT_STATUS.PICKUP_CONFIRMED,
  TRAVEL_FULFILLMENT_STATUS.USER_CONFIRMED,
  TRAVEL_FULFILLMENT_STATUS.QR_ISSUED,
  TRAVEL_FULFILLMENT_STATUS.CHECKED_IN,
  TRAVEL_FULFILLMENT_STATUS.IN_TRIP,
  TRAVEL_FULFILLMENT_STATUS.COMPLETED,
  TRAVEL_FULFILLMENT_STATUS.CANCELLED,
].includes(status)
