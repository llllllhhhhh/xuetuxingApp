<template>
	<view class="page">
		<view class="content">
			<view class="title-row">
				<view>
					<view class="big">路线管理</view>
					<view class="sub">共 128 条路线 · 上架 96</view>
				</view>
				<view class="btn add" @click="show=true">＋ 新增路线</view>
			</view>
			<view class="tabs route-tabs">
				<view class="tab on">全部路线</view>
				<view class="tab">分类管理</view>
				<view class="tab">团期库存</view>
			</view>
			<view class="route-manage card" v-for="r in routes" :key="r.name">
				<image :src="r.img" mode="aspectFill" />
				<view class="route-info"><b>{{r.name}}</b>
					<view><text class="tag">{{r.type}}</text><text class="tag tag-orange">{{r.days}}</text></view>
					<view class="sub">{{r.agency}} · 库存 {{r.stock}}</view>
					<view class="row-actions"><text @click="edit(r)">编辑</text><text
							@click="toast('团期库存设置')">团期</text><text @click="toast('旅行社绑定配置')">旅行社</text></view>
				</view>
				<view class="switch" :class="{on:r.on}" @click="r.on=!r.on">
					<view class="switch-dot" />
				</view>
			</view>
		</view>
		<view v-if="show" class="modal-mask" @click.self="show=false">
			<view class="modal">
				<view class="card-title">{{editing?'编辑':'新增'}}旅行路线</view>
				<view class="form-item">
					<view class="label">路线名称</view><input class="input" :value="editing?.name" placeholder="请输入路线名称" />
				</view>
				<view class="form-item">
					<view class="label">分类</view>
					<view class="choices"><text class="choice on">户外</text><text class="choice">研学</text><text
							class="choice">城市</text></view>
				</view>
				<view class="btn btn-green" @click="save">保存路线</view>
			</view>
		</view>
	</view>
</template>
<script setup>
	import {
		ref,
		reactive
	} from 'vue';
	const show = ref(false),
		editing = ref(null);
	const routes = reactive([{
		name: '川西雪山轻徒步',
		type: '户外',
		days: '5天4夜',
		agency: '山海旅行',
		stock: 42,
		on: true,
		img: 'https://images.unsplash.com/photo-1464278533981-50106e6176b1?w=400'
	}, {
		name: '泉州非遗漫游',
		type: '研学',
		days: '3天2夜',
		agency: '知行文旅',
		stock: 28,
		on: true,
		img: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400'
	}, {
		name: '青岛海风毕业季',
		type: '团建',
		days: '3天2夜',
		agency: '青年假日',
		stock: 0,
		on: false,
		img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400'
	}]);
	const edit = r => {
		editing.value = r;
		show.value = true
	};
	const save = () => {
		show.value = false;
		uni.showToast({
			title: '路线已保存',
			icon: 'success'
		})
	};
	const toast = title => uni.showToast({
		title,
		icon: 'none'
	})
</script>
<style scoped>
	.add {
		height: 70rpx;
		padding: 0 24rpx;
		background: #ff7a35;
		color: #fff
	}

	.route-tabs {
		margin-top: 30rpx
	}

	.route-manage {
		display: flex;
		gap: 20rpx;
		align-items: center
	}

	.route-manage>image {
		width: 150rpx;
		height: 150rpx;
		border-radius: 18rpx
	}

	.route-info {
		flex: 1
	}

	.route-info b {
		display: block;
		margin-bottom: 10rpx
	}

	.row-actions {
		display: flex;
		gap: 24rpx;
		color: #12a594;
		font-size: 22rpx;
		margin-top: 10rpx
	}

	.modal-mask {
		position: fixed;
		inset: 0;
		background: rgba(10, 30, 27, .6);
		z-index: 50;
		display: flex;
		align-items: flex-end
	}

	.modal {
		background: #fff;
		border-radius: 35rpx 35rpx 0 0;
		padding: 38rpx;
		width: 100%
	}
</style>