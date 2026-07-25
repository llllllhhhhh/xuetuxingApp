<template>
	<view class="page">
		<view class="content">
			<view class="notice">规则修改后将影响新产生的数据，历史已发放积分不追溯变更。</view>
			<view class="card rules-card">
				<view class="card-title">积分获取规则</view>
				<view class="rule-form">
					<view><b>单次有效邀请积分</b><text>好友首次注册并绑定手机号后发放</text></view>
					<view class="num-input"><input value="1" type="number" /><text>分</text></view>
				</view>
				<view class="rule-form">
					<view><b>积分有效期</b><text>从积分发放之日起计算</text></view>
					<view class="num-input"><input value="365" type="number" /><text>天</text></view>
				</view>
			</view>
			<view class="card">
				<view class="card-title">泰山游兑换规则</view>
				<view class="rule-form" v-for="r in rules" :key="r.name">
					<view><b>{{r.name}}</b><text>{{r.tip}}</text></view>
					<view class="num-input"><input :value="r.value" type="number" /><text>{{r.unit}}</text></view>
				</view>
			</view>
			<view class="card">
				<view class="title-row">
					<view><b>规则启用状态</b>
						<view class="sub">关闭后暂停发放与兑换</view>
					</view>
					<switch checked color="#12a594" />
				</view>
			</view>
			<view class="btn btn-primary" @click="save">保存配置</view>
		</view>
	</view>
</template>
<script setup>
	const rules = [{
		name: '兑换所需积分',
		tip: '达到该积分后开放兑换按钮',
		value: 100,
		unit: '分'
	}, {
		name: '单人年度兑换上限',
		tip: '按自然年统计',
		value: 1,
		unit: '次'
	}, {
		name: '月度兑换名额',
		tip: '所有用户共享库存',
		value: 50,
		unit: '份'
	}];
	const save = () => uni.showToast({
		title: '配置已保存',
		icon: 'success'
	})
</script>
<style scoped>
	.rules-card {
		margin-top: 22rpx
	}

	.rule-form {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 25rpx 0;
		border-bottom: 1rpx solid #e7ebe7
	}

	.rule-form>view:first-child {
		flex: 1
	}

	.rule-form b,
	.rule-form>view>text {
		display: block
	}

	.rule-form>view>text {
		font-size: 21rpx;
		color: #778684;
		margin-top: 8rpx
	}

	.num-input {
		display: flex;
		align-items: center;
		background: #f2f5f2;
		border-radius: 15rpx;
		padding: 0 15rpx
	}

	.num-input input {
		width: 95rpx;
		height: 70rpx;
		text-align: right;
		margin-right: 8rpx
	}
</style>