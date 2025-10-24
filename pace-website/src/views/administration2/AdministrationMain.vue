<template>
    <div>
        <h1 class="title">Administration</h1>
    </div>
    <div v-for="tab in availableTabs" :key="tab.id">
        <h2>{{ tab.name }}</h2>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, nextTick } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { Building, Users } from 'lucide-vue-next'

const { user } = useAuth()


onMounted(async () => {
    await nextTick()
    console.log("user", user.value)
})

const availableTabs = computed(() => {
    console.log("user.value?.roles", user.value?.roles)
    const availableTabs = []
    if (user.value?.roles.includes(3)) {
        availableTabs.push({ id: 'dealer-group', name: 'Dealer Group Management', icon: Building })
    }
    if (user.value?.roles.includes(2)) {
        availableTabs.push({ id: 'dealership', name: 'Dealership Management', icon: Building })
    }
    if (user.value?.roles.includes(4)) {
        availableTabs.push({ id: 'seller', name: 'Seller Management', icon: Users })
    }
    return availableTabs
})

</script>

<style scoped>

.title {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
}

</style>