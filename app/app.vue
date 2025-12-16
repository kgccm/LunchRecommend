<template>
  <v-app class="app-background">
    <!-- Header -->
    <v-app-bar flat color="transparent" class="px-4 mt-2" absolute>
      <template v-slot:prepend>
        <v-avatar color="primary" size="40">
          <v-icon color="white" icon="mdi-food-fork-drink"></v-icon>
        </v-avatar>
      </template>
      <v-app-bar-title class="font-weight-bold text-h6 text-grey-darken-3">
        오늘 점심 뭐 먹지?
      </v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-container class="h-100 align-start pt-4 pt-md-16">
        <v-row justify="center">
          <v-col cols="12" md="10" lg="8" xl="6">
            <!-- Map Container -->
            <v-card class="mx-auto rounded-xl elevation-3 mb-6 map-card-container position-relative">
              <div id="map" class="map-view"></div>
              
              <!-- Map Overlay Controls -->
              <div class="map-overlay-top px-4 py-3 d-flex align-center justify-center">
                 <v-card class="rounded-pill px-4 py-2 d-flex align-center elevation-2" color="surface">
                    <v-icon color="primary" icon="mdi-map-marker" class="mr-2"></v-icon>
                    <span class="text-body-2 font-weight-bold text-truncate" style="max-width: 200px;">
                      {{ currentAddress || '지도를 움직여 위치를 설정하세요' }}
                    </span>
                 </v-card>
              </div>

              <!-- Bottom Overlay Container -->
              <div class="map-overlay-bottom pb-4 d-flex justify-center align-end w-100">
                <!-- Search Button -->
                <v-btn
                  color="primary"
                  rounded="pill"
                  size="large"
                  prepend-icon="mdi-refresh"
                  class="elevation-4 font-weight-bold mb-2 pointer-events-auto"
                  :loading="loading"
                  @click="searchInBounds"
                >
                  이 지역 검색
                </v-btn>

                <!-- My Location FAB (Positioned absolutely relative to the card) -->
                <v-btn
                  icon="mdi-crosshairs-gps"
                  color="white"
                  size="small"
                  class="position-absolute elevation-3 pointer-events-auto"
                  style="right: 16px; bottom: 24px; color: #333;"
                  :loading="loading"
                  @click="getCurrentLocation"
                ></v-btn>
              </div>
            </v-card>

            <!-- Results Section -->
            <v-slide-y-transition>
              <div v-if="restaurants.length > 0">
                <div
                  class="d-flex flex-wrap justify-space-between align-end mb-4 px-2 gap-2"
                >
                  <div>
                    <span
                      class="text-h6 text-md-h5 font-weight-bold text-grey-darken-3"
                    >
                      발견한 맛집
                    </span>
                    <v-chip
                      class="ml-2 font-weight-bold"
                      color="primary"
                      size="small"
                      variant="flat"
                    >
                      {{ restaurants.length }}곳
                    </v-chip>
                  </div>
                  <v-btn
                    color="secondary"
                    size="large"
                    prepend-icon="mdi-slot-machine"
                    class="font-weight-bold text-white pulse-animation w-100 w-sm-auto mt-2 mt-sm-0"
                    elevation="4"
                    @click="pickRandom"
                  >
                    랜덤 추천 돌리기
                  </v-btn>
                </div>

                <v-row>
                  <v-col
                    v-for="(place, index) in restaurants"
                    :key="index"
                    cols="12"
                    sm="6"
                    lg="4"
                  >
                    <v-card
                      class="h-100 restaurant-card border-thin"
                      elevation="0"
                      hover
                      @click="panTo(place.lat, place.lon)"
                    >
                      <v-card-item>
                        <template v-slot:prepend>
                          <v-avatar
                            color="orange-lighten-5"
                            rounded="lg"
                            size="48"
                          >
                            <v-icon
                              color="primary"
                              icon="mdi-storefront"
                            ></v-icon>
                          </v-avatar>
                        </template>
                        <v-card-title
                          class="font-weight-bold text-body-1 text-truncate"
                        >
                          {{ place.title }}
                        </v-card-title>
                        <v-card-subtitle class="mt-1">
                          <span class="text-primary font-weight-medium">{{
                            place.category
                          }}</span>
                        </v-card-subtitle>
                      </v-card-item>

                      <v-card-text class="pt-2 text-grey-darken-1 text-caption">
                        <v-icon
                          size="small"
                          icon="mdi-walk"
                          class="mr-1"
                        ></v-icon>
                        {{ place.roadAddress }}
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
            </v-slide-y-transition>

            <!-- Empty State -->
            <div
              v-if="!loading && restaurants.length === 0 && searched"
              class="text-center py-10"
            >
              <v-icon
                size="64"
                color="grey-lighten-2"
                icon="mdi-map-search-outline"
              ></v-icon>
              <div class="text-h6 text-grey mt-4">
                이 근처엔 식당 데이터가 없네요.
              </div>
              <div class="text-body-2 text-grey-lighten-1">
                지도를 다른 곳으로 이동해보세요.
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>

      <!-- Winner Dialog -->
      <v-dialog
        v-model="dialog"
        max-width="450"
        transition="dialog-bottom-transition"
      >
        <v-card class="text-center pa-6 rounded-xl overflow-visible">
          <div class="winner-icon-wrapper">
            <v-avatar color="primary" size="80" class="elevation-6">
              <v-icon size="40" color="white" icon="mdi-trophy"></v-icon>
            </v-avatar>
          </div>

          <v-card-title class="text-h4 font-weight-black mt-8 text-primary">
            오늘의 선택!
          </v-card-title>

          <v-card-text class="mt-2">
            <div class="text-h5 font-weight-bold text-grey-darken-3 mb-2">
              {{ winner?.title }}
            </div>
            <v-chip color="secondary" class="mb-6 font-weight-bold">
              {{ winner?.category }}
            </v-chip>

            <div
              class="bg-grey-lighten-4 pa-4 rounded-lg text-body-2 text-grey-darken-2 d-flex align-center justify-center gap-2"
            >
              <v-icon size="small" color="grey">mdi-map-marker</v-icon>
              {{ winner?.roadAddress }}
            </div>
          </v-card-text>

          <v-card-actions class="justify-center mt-4 gap-2">
            <v-btn variant="text" color="grey" @click="dialog = false"
              >다시 하기</v-btn
            >
            <v-btn
              color="primary"
              variant="flat"
              size="large"
              @click="dialog = false"
              >확인</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Snackbar -->
      <v-snackbar
        v-model="snackbar"
        :color="snackbarColor"
        location="top"
        rounded="pill"
      >
        <div
          class="d-flex align-center justify-center text-center w-100 font-weight-bold"
        >
          {{ snackbarText }}
        </div>
      </v-snackbar>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import "leaflet/dist/leaflet.css";

// State
const loading = ref(false);
const searched = ref(false);
const restaurants = ref<any[]>([]);
const currentAddress = ref("");
const dialog = ref(false);
const winner = ref<any>(null);
const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

// Map Refs
let map: any = null;
let markers: any[] = [];
let L: any = null;

// Initial Coords (Seoul City Hall Default)
const center = ref({ lat: 37.5665, lng: 126.978 });

onMounted(async () => {
  // Dynamic import for Leaflet (Client-side only)
  if (process.client) {
    L = (await import("leaflet")).default;

    // Fix Leaflet's default icon path issues in Webpack/Vite
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    initMap();
    getCurrentLocation();
  }
});

const initMap = () => {
  map = L.map("map", {
    zoomControl: false, // We can add custom controls if needed
  }).setView([center.value.lat, center.value.lng], 16);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  // Update address on drag end
  map.on("moveend", () => {
    const c = map.getCenter();
    center.value = { lat: c.lat, lng: c.lng };
    // Optional: Reverse geocode here to update text, but skipping to save API calls
    currentAddress.value = "지도 위치 기준";
  });
};

const getCurrentLocation = () => {
  if (navigator.geolocation) {
    loading.value = true;
    showMsg("현 위치로 이동합니다...", "info");
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        center.value = { lat: latitude, lng: longitude };
        
        if (map) {
          // Use flyTo for smooth animation
          map.flyTo([latitude, longitude], 16, {
            duration: 1.5, // Animation duration in seconds
            easeLinearity: 0.25
          });
          
          // Wait for animation to finish before searching (optional, but looks better)
          setTimeout(() => {
            searchInBounds();
          }, 1500);
        }
        loading.value = false;
      },
      (err) => {
        console.error(err);
        showMsg("위치 권한을 허용하면 내 주변 맛집을 찾을 수 있어요.", "info");
        loading.value = false;
      }
    );
  }
};

const searchInBounds = async () => {
  if (!map) return;

  loading.value = true;
  searched.value = true;

  // Clear old markers
  markers.forEach((m) => m.remove());
  markers = [];

  const c = map.getCenter();

  try {
    const data: any = await $fetch("/api/restaurants", {
      params: { lat: c.lat, lon: c.lng },
    });

    restaurants.value = data.items || [];

    if (restaurants.value.length > 0) {
      restaurants.value.forEach((place) => {
        const marker = L.marker([place.lat, place.lon])
          .addTo(map)
          .bindPopup(`<b>${place.title}</b><br>${place.category}`);
        markers.push(marker);
      });
      showMsg(`${restaurants.value.length}개의 맛집을 찾았습니다!`);
    } else {
      showMsg("이 근처에는 데이터가 없네요.", "warning");
    }
  } catch (e) {
    console.error(e);
    showMsg("데이터를 불러오는데 실패했습니다.", "error");
  } finally {
    loading.value = false;
  }
};

const panTo = (lat: number, lon: number) => {
  if (map) {
    map.flyTo([lat, lon], 18);
    // Open popup for that marker
    // Implementation detail: we'd need to link markers to IDs to do this perfectly
  }
};

const pickRandom = () => {
  if (restaurants.value.length === 0) return;
  const index = Math.floor(Math.random() * restaurants.value.length);
  winner.value = restaurants.value[index];
  dialog.value = true;

  // Move map to winner
  panTo(winner.value.lat, winner.value.lon);
};

const showMsg = (text: string, color = "success") => {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
};
</script>

<style scoped>
.map-card-container {
  position: relative;
  height: 400px;
  width: 100%;
}

.map-view {
  height: 100%;
  width: 100%;
  z-index: 1;
}

.map-overlay-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 500;
  pointer-events: none; /* Let clicks pass through */
}
.map-overlay-top .v-card {
  pointer-events: auto;
}

.map-overlay-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 500;
  pointer-events: none; /* Let clicks pass through container */
}
.pointer-events-auto {
  pointer-events: auto !important; /* Re-enable clicks for buttons */
}

/* Common Styles */
.v-application {
  font-family: "Noto Sans KR", sans-serif !important;
}
.app-background {
  background-color: #f8f9fa !important;
}
.restaurant-card {
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  background-color: white;
  border-color: #e0e0e0 !important;
}
.restaurant-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08) !important;
  border-color: #ff5722 !important;
}
.winner-icon-wrapper {
  margin-top: -50px;
  display: flex;
  justify-content: center;
}
.gap-2 {
  gap: 8px;
}
</style>
