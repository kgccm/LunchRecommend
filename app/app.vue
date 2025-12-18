<template>
  <v-app class="app-background">
    <!-- Header -->
    <v-app-bar flat color="transparent" class="px-4 mt-2" absolute>
      <template v-slot:prepend>
        <v-avatar color="warning" size="40">
          <v-icon color="white" icon="mdi-food"></v-icon>
        </v-avatar>
      </template>
      <v-app-bar-title class="font-weight-bold text-h6 text-grey-darken-3">
        오점뭐먹?
      </v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-container class="h-100 align-start pt-4 pt-md-16" fluid>
        <v-row justify="center" class="h-100">
          <v-col
            cols="12"
            md="10"
            lg="8"
            xl="6"
            class="d-flex flex-column h-100"
            style="max-height: calc(100vh - 80px)"
          >
            <!-- Fixed Top Section: Map & Controls -->
            <div class="flex-shrink-0 bg-background pb-2">
              <!-- Map Container -->
              <v-card
                class="mx-auto rounded-xl elevation-3 mb-4 map-card-container position-relative"
              >
                <div id="map" class="map-view"></div>

                <!-- Map Overlay Controls (Search Bar & Filters) -->
                <div
                  class="map-overlay-top px-4 py-3 d-flex flex-column align-center w-100"
                >
                  <!-- Search Bar -->
                  <v-card
                    class="rounded-pill px-2 py-1 d-flex align-center elevation-2 w-100 mb-2"
                    style="max-width: 400px"
                    color="surface"
                  >
                    <v-text-field
                      v-model="searchQuery"
                      density="compact"
                      variant="plain"
                      hide-details
                      prepend-inner-icon="mdi-magnify"
                      placeholder="장소 검색 (예: 강남역)"
                      class="ml-2 font-weight-bold"
                      @keyup.enter="searchLocation"
                      single-line
                    ></v-text-field>
                    <v-btn
                      icon="mdi-arrow-right"
                      size="small"
                      variant="text"
                      color="primary"
                      @click="searchLocation"
                    ></v-btn>
                  </v-card>

                  <!-- Category Filters -->
                  <v-slide-group
                    v-model="selectedCategory"
                    show-arrows
                    class="w-100"
                    style="max-width: 600px"
                    selected-class="bg-primary text-white"
                  >
                    <v-slide-group-item
                      v-for="cat in categories"
                      :key="cat"
                      v-slot="{ isSelected, toggle }"
                      :value="cat"
                    >
                      <v-chip
                        class="ma-1 font-weight-bold elevation-1"
                        :color="isSelected ? 'primary' : 'white'"
                        :variant="isSelected ? 'flat' : 'elevated'"
                        @click="
                          () => {
                            toggle();
                            onCategoryChange(cat);
                          }
                        "
                      >
                        {{ cat }}
                      </v-chip>
                    </v-slide-group-item>
                  </v-slide-group>
                </div>

                <!-- Bottom Overlay Container -->
                <div
                  class="map-overlay-bottom pb-4 d-flex justify-center align-end w-100"
                >
                  <!-- Search Nearby Button -->
                  <v-btn
                    color="warning"
                    rounded="pill"
                    size="large"
                    prepend-icon="mdi-silverware-fork-knife"
                    class="elevation-4 font-weight-bold mb-2 pointer-events-auto"
                    :loading="loading"
                    @click="searchNearbyRestaurants"
                  >
                    이 지역 맛집 찾기
                  </v-btn>

                  <!-- My Location FAB -->
                  <v-btn
                    icon="mdi-crosshairs-gps"
                    color="white"
                    size="small"
                    class="position-absolute elevation-3 pointer-events-auto"
                    style="right: 16px; bottom: 24px; color: #333"
                    :loading="loading"
                    @click="getCurrentLocation"
                  ></v-btn>
                </div>
              </v-card>
            </div>

            <!-- Scrollable Bottom Section: List -->
            <div class="flex-grow-1 overflow-y-auto px-1 pb-4 scroll-container">
              <!-- Results Header & Random Button -->
              <div
                v-if="restaurants.length > 0"
                class="d-flex flex-wrap justify-space-between align-end px-2 gap-2 mb-2"
              >
                <div>
                  <span
                    class="text-h6 text-md-h5 font-weight-bold text-grey-darken-3"
                  >
                    발견한 맛집
                  </span>
                  <v-chip
                    class="ml-2 font-weight-bold"
                    color="warning"
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

              <!-- List -->
              <v-slide-y-transition>
                <div v-if="restaurants.length > 0">
                  <v-row>
                    <v-col
                      v-for="(place, index) in restaurants"
                      :key="place.id"
                      cols="12"
                      sm="6"
                      lg="4"
                    >
                    <v-card
                      class="h-100 restaurant-card border-thin"
                      elevation="0"
                      hover
                      @click="panTo(place.y, place.x, place.id)"
                    >
                      <v-card-item>
                        <template v-slot:prepend>
                          <v-avatar
                            color="orange-lighten-5"
                            rounded="lg"
                            size="48"
                          >
                            <v-icon
                              color="warning"
                              icon="mdi-storefront"
                            ></v-icon>
                          </v-avatar>
                        </template>
                        <v-card-title
                          class="font-weight-bold text-body-1 text-truncate"
                        >
                          {{ place.place_name }}
                        </v-card-title>
                        <v-card-subtitle class="mt-1">
                          <span class="text-primary font-weight-medium">{{
                            place.category_name?.split(">").pop()?.trim() ||
                            "음식점"
                          }}</span>
                        </v-card-subtitle>
                      </v-card-item>

                      <v-card-text class="pt-2 text-grey-darken-1 text-caption">
                        <v-icon
                          size="small"
                          icon="mdi-map-marker-outline"
                          class="mr-1"
                        ></v-icon>
                        {{ place.road_address_name || place.address_name }}
                        <div v-if="place.phone" class="mt-1">
                          <v-icon
                            size="small"
                            icon="mdi-phone"
                            class="mr-1"
                          ></v-icon>
                          {{ place.phone }}
                        </div>
                      </v-card-text>

                      <v-card-actions>
                        <v-btn
                          variant="text"
                          color="info"
                          size="small"
                          :href="place.place_url"
                          target="_blank"
                          @click.stop
                        >
                          상세보기
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-col>
                  </v-row>

                <!-- Load More Button -->
                <div
                  class="text-center mt-6 mb-10"
                  v-if="pagination && pagination.hasNextPage"
                >
                  <v-btn
                    variant="tonal"
                    color="warning"
                    size="large"
                    rounded="pill"
                    prepend-icon="mdi-plus"
                    :loading="loading"
                    @click="loadMore"
                  >
                    더 보기
                  </v-btn>
                </div>
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
            <v-avatar color="warning" size="80" class="elevation-6">
              <v-icon size="40" color="white" icon="mdi-trophy"></v-icon>
            </v-avatar>
          </div>

          <v-card-title class="text-h4 font-weight-black mt-8 text-warning">
            오늘의 선택!
          </v-card-title>

          <v-card-text class="mt-2">
            <div class="text-h5 font-weight-bold text-grey-darken-3 mb-2">
              {{ winner?.place_name }}
            </div>
            <v-chip color="secondary" class="mb-6 font-weight-bold">
              {{ winner?.category_name?.split(">").pop()?.trim() }}
            </v-chip>

            <!-- Address (Clickable) -->
            <v-card
              v-if="winner"
              class="mx-auto rounded-lg mb-4 pa-5 d-flex align-center justify-center cursor-pointer hover-effect border-thin"
              variant="outlined"
              color="grey-lighten-2"
              :href="winner.place_url"
              target="_blank"
              rel="noopener noreferrer"
              max-width="360"
            >
              <div class="d-flex flex-column align-center text-grey-darken-3">
                <div class="d-flex align-center gap-1 mb-1">
                  <v-icon size="small" color="primary">mdi-map-marker</v-icon>
                  <span class="text-body-2 font-weight-medium text-decoration-underline">
                    {{ winner.road_address_name || winner.address_name }}
                  </span>
                </div>
                <div class="text-caption text-primary font-weight-bold d-flex align-center">
                  상세보기 <v-icon size="x-small" icon="mdi-chevron-right"></v-icon>
                </div>
              </div>
            </v-card>
          </v-card-text>

          <v-card-actions class="justify-center mt-4 gap-2">
            <v-btn variant="text" color="grey" @click="pickRandom"
              >다시 하기</v-btn
            >
            <v-btn
              color="warning"
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

// State
const loading = ref(false);
const searched = ref(false);
const restaurants = ref<any[]>([]);
const searchQuery = ref("");
const dialog = ref(false);
const winner = ref<any>(null);
const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

// Categories
const categories = [
  "전체",
  "한식",
  "중식",
  "일식",
  "양식",
  "분식",
  "치킨",
  "카페",
];
const selectedCategory = ref("전체");

// Kakao Pagination Object
const pagination = ref<any>(null);

// Map Refs
let map: any = null;
let markers: any[] = [];
let infowindow: any = null;
let ps: any = null; // Places Service
let geocoder: any = null;

const config = useRuntimeConfig();

useHead({
  script: [
    {
      src: `//dapi.kakao.com/v2/maps/sdk.js?appkey=${config.public.kakaoApiKey}&libraries=services,clusterer&autoload=false`,
      async: true,
      defer: true,
      onload: () => {
        // Kakao SDK load finished, now load the map
        // @ts-ignore
        kakao.maps.load(() => {
          initMap();
        });
      },
    },
  ],
});

onMounted(() => {
  // If already loaded
  // @ts-ignore
  if (window.kakao && window.kakao.maps) {
    // @ts-ignore
    kakao.maps.load(() => {
      initMap();
    });
  }
});

const initMap = () => {
  const container = document.getElementById("map");
  // @ts-ignore
  const kakao = window.kakao;

  if (!container || !kakao) return;

  const options = {
    center: new kakao.maps.LatLng(37.566826, 126.9786567), // Seoul City Hall
    level: 3, // Zoom level (smaller is closer)
  };

  map = new kakao.maps.Map(container, options);

  // Services
  ps = new kakao.maps.services.Places();
  geocoder = new kakao.maps.services.Geocoder();
  infowindow = new kakao.maps.InfoWindow({ zIndex: 1 });

  // Init location
  getCurrentLocation();
};

const getCurrentLocation = () => {
  if (navigator.geolocation) {
    loading.value = true;
    showMsg("현 위치로 이동합니다...", "info");

    // Reset search state
    searchQuery.value = "";
    selectedCategory.value = "전체";

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // @ts-ignore
        const kakao = window.kakao;
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        if (!map) return;

        const locPosition = new kakao.maps.LatLng(lat, lon);

        map.panTo(locPosition);
        loading.value = false;

        // Auto search nearby restaurants after moving
        setTimeout(() => searchNearbyRestaurants(), 500);
      },
      (err) => {
        console.error(err);
        showMsg("위치 권한을 허용해주세요.", "info");
        loading.value = false;
        // Even if location fails, try to search around default center
        setTimeout(() => searchNearbyRestaurants(), 500);
      }
    );
  }
};

// 1. Search Location (e.g., "Gangnam Station" or "Specific Restaurant")
const searchLocation = () => {
  if (!searchQuery.value) return;
  if (!ps) return;

  loading.value = true;
  selectedCategory.value = ""; // Clear category selection on manual search

  // Keyword Search with location bias
  const options = {
    location: map.getCenter(),
    radius: 2000, // 2km
  };

  const searchCallback = (data: any, status: any, _pagination: any) => {
    loading.value = false;
    // @ts-ignore
    const kakao = window.kakao;

    if (status === kakao.maps.services.Status.OK) {
      // 1. Move map to the first result
      const bounds = new kakao.maps.LatLngBounds();
      // bounds.extend(new kakao.maps.LatLng(data[0].y, data[0].x));
      // Extend bounds for ALL results to show them all
      data.forEach((place: any) => {
        bounds.extend(new kakao.maps.LatLng(place.y, place.x));
      });
      map.setBounds(bounds);

      // 2. Update the list with THESE results (don't search nearby again)
      restaurants.value = data;
      displayMarkers(data);
      pagination.value = _pagination;
      searched.value = true;

      showMsg(`'${searchQuery.value}' 검색 결과: ${data.length}건`);
    } else if (status === kakao.maps.services.Status.ZERO_RESULT && options) {
      // Fallback: Global search if local search fails
      // @ts-ignore
      ps.keywordSearch(searchQuery.value, (d, s, p) => {
        if (s === kakao.maps.services.Status.OK) {
          const bounds = new kakao.maps.LatLngBounds();
          d.forEach((place: any) => {
            bounds.extend(new kakao.maps.LatLng(place.y, place.x));
          });
          map.setBounds(bounds);

          // Update list with global results
          restaurants.value = d;
          displayMarkers(d);
          pagination.value = p;
          searched.value = true;

          showMsg(`전국 검색 결과: ${d.length}건`);
        } else {
          showMsg("장소를 찾을 수 없습니다.", "error");
          restaurants.value = [];
        }
      });
    } else {
      showMsg("장소를 찾을 수 없습니다.", "error");
      restaurants.value = [];
    }
  };

  // Clear existing markers before search
  removeMarkers();
  ps.keywordSearch(searchQuery.value, searchCallback, options);
};

const onCategoryChange = (cat: string) => {
  selectedCategory.value = cat;
  // Auto search when category changes
  setTimeout(() => {
    searchNearbyRestaurants();
  }, 100);
};

// 2. Search Restaurants in current map bounds
const searchNearbyRestaurants = () => {
  if (!map || !ps) return;
  // @ts-ignore
  const kakao = window.kakao;

  loading.value = true;
  searched.value = true;

  // Clear old
  removeMarkers();
  restaurants.value = [];
  pagination.value = null;

  const center = map.getCenter();
  const options = {
    location: center,
    radius: 1500, // 1km radius
    sort: kakao.maps.services.SortBy.DISTANCE,
  };

  const cat = selectedCategory.value;

  if (cat === "전체") {
    // Search all restaurants (FD6)
    ps.categorySearch("FD6", placesSearchCB, options);
  } else if (cat === "카페") {
    // Search cafes (CE7)
    ps.categorySearch("CE7", placesSearchCB, options);
  } else {
    // Keyword search (e.g. "한식", "중식")
    // We search for the keyword around the center
    ps.keywordSearch(cat, placesSearchCB, options);
  }
};

// 3. Callback for Search
const placesSearchCB = (data: any, status: any, _pagination: any) => {
  loading.value = false;
  // @ts-ignore
  const kakao = window.kakao;

  if (status === kakao.maps.services.Status.OK) {
    // Add items
    restaurants.value = [...restaurants.value, ...data];

    // Display markers
    displayMarkers(data);

    // Save pagination object for "Load More"
    pagination.value = _pagination;

    if (_pagination.current === 1) {
      showMsg(`${data.length}개의 맛집을 찾았습니다!`);
    }
  } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
    if (!pagination.value) {
      showMsg("이 근처에는 데이터가 없네요.", "warning");
    }
  } else {
    showMsg("검색 중 오류가 발생했습니다.", "error");
  }
};

const loadMore = () => {
  if (pagination.value && pagination.value.hasNextPage) {
    loading.value = true;
    pagination.value.nextPage();
  }
};

const displayMarkers = (places: any[]) => {
  // @ts-ignore
  const kakao = window.kakao;

  places.forEach((place) => {
    const marker = new kakao.maps.Marker({
      map: map,
      position: new kakao.maps.LatLng(place.y, place.x),
    });

    kakao.maps.event.addListener(marker, "click", () => {
      infowindow.setContent(`
        <div style="padding:5px;font-size:12px;text-align:center;min-width:150px;">
          <strong>${place.place_name}</strong><br>
          <span style="color:gray">${place.category_name?.split(">").pop()}</span>
        </div>
      `);
      infowindow.open(map, marker);
    });

    markers.push(marker);
  });
};

const removeMarkers = () => {
  markers.forEach((m) => m.setMap(null));
  markers = [];
};

const panTo = (lat: any, lon: any, id: string) => {
  if (!map) return;
  // @ts-ignore
  const kakao = window.kakao;
  map.panTo(new kakao.maps.LatLng(lat, lon));

  // Ideally open info window
};

const pickRandom = () => {
  if (restaurants.value.length === 0) return;
  const index = Math.floor(Math.random() * restaurants.value.length);
  winner.value = restaurants.value[index];
  dialog.value = true;
  panTo(winner.value.y, winner.value.x, winner.value.id);
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
  pointer-events: none;
}
.map-overlay-top .v-card,
.map-overlay-top .v-slide-group {
  pointer-events: auto;
}

.map-overlay-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 500;
  pointer-events: none;
}
.pointer-events-auto {
  pointer-events: auto !important;
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
  border-color: #ffc107 !important; /* Warning color */
}
.winner-icon-wrapper {
  margin-top: -50px;
  display: flex;
  justify-content: center;
}
.gap-2 {
  gap: 8px;
}
/* Hide scrollbar for Chrome, Safari and Opera */
.scroll-container::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.scroll-container {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
