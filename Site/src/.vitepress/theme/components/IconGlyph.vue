<script setup lang="ts">
export type IconName =
  | 'files'
  | 'search'
  | 'folder'
  | 'folder-open'
  | 'doc'
  | 'book'
  | 'tree'
  | 'tiles'
  | 'chevron-right'
  | 'chevron-down'
  | 'close'
  | 'panel-left'
  | 'panel-right'
  | 'sun'
  | 'moon'
  | 'comment'
  | 'settings'
  | 'expand'
  | 'collapse'
  | 'arrow-left'
  | 'arrow-right'
  | 'reset'

withDefaults(
  defineProps<{
    name: IconName
    size?: number
  }>(),
  {
    size: 16,
  }
)
</script>

<template>
  <svg
    class="icon-glyph"
    :width="size"
    :height="size"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- Explorer Files -->
    <template v-if="name === 'files'">
      <rect x="2" y="2" width="8" height="10" stroke="currentColor" stroke-width="1.4" />
      <path d="M10 5H13.5V14H5.5V12" stroke="currentColor" stroke-width="1.4" />
    </template>

    <!-- Search -->
    <template v-else-if="name === 'search'">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5" />
      <line x1="10.4" y1="10.4" x2="14" y2="14" stroke="currentColor" stroke-width="1.6" />
    </template>

    <!-- Folder Closed -->
    <template v-else-if="name === 'folder'">
      <path d="M1.5 3H6.2L7.7 4.8H14.5V13H1.5V3Z" stroke="currentColor" stroke-width="1.35" />
    </template>

    <!-- Folder Open -->
    <template v-else-if="name === 'folder-open'">
      <path d="M1.5 3H6.2L7.7 4.8H13.5V7H3.2L1.5 13V3Z" stroke="currentColor" stroke-width="1.35" />
      <path d="M1.5 13L3.2 7H14.8L13.1 13H1.5Z" stroke="currentColor" stroke-width="1.35" />
    </template>

    <!-- Scene Document -->
    <template v-else-if="name === 'doc'">
      <path d="M3 1.5H10L13 4.5V14.5H3V1.5Z" stroke="currentColor" stroke-width="1.35" />
      <path d="M10 1.5V4.5H13" stroke="currentColor" stroke-width="1.35" />
      <line x1="5.2" y1="7.5" x2="10.8" y2="7.5" stroke="currentColor" stroke-width="1.2" />
      <line x1="5.2" y1="10.5" x2="9.2" y2="10.5" stroke="currentColor" stroke-width="1.2" />
    </template>

    <!-- Full Book / Chapter Document -->
    <template v-else-if="name === 'book'">
      <rect x="2.2" y="2" width="11.6" height="12" stroke="currentColor" stroke-width="1.35" />
      <line x1="5.5" y1="2" x2="5.5" y2="14" stroke="currentColor" stroke-width="1.35" />
      <line x1="7.8" y1="5.5" x2="11.4" y2="5.5" stroke="currentColor" stroke-width="1.2" />
      <line x1="7.8" y1="8.5" x2="11.4" y2="8.5" stroke="currentColor" stroke-width="1.2" />
    </template>

    <!-- Tree List View -->
    <template v-else-if="name === 'tree'">
      <line x1="2" y1="3.5" x2="14" y2="3.5" stroke="currentColor" stroke-width="1.4" />
      <line x1="5" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.4" />
      <line x1="5" y1="12.5" x2="14" y2="12.5" stroke="currentColor" stroke-width="1.4" />
      <path d="M2.5 5V12.5H4.2" stroke="currentColor" stroke-width="1.2" />
    </template>

    <!-- Tile Icon Grid View -->
    <template v-else-if="name === 'tiles'">
      <rect x="2" y="2" width="5" height="5" stroke="currentColor" stroke-width="1.35" />
      <rect x="9" y="2" width="5" height="5" stroke="currentColor" stroke-width="1.35" />
      <rect x="2" y="9" width="5" height="5" stroke="currentColor" stroke-width="1.35" />
      <rect x="9" y="9" width="5" height="5" stroke="currentColor" stroke-width="1.35" />
    </template>

    <!-- Chevron Right -->
    <template v-else-if="name === 'chevron-right'">
      <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" stroke-width="1.45" />
    </template>

    <!-- Chevron Down -->
    <template v-else-if="name === 'chevron-down'">
      <path d="M3.5 6L8 10.5L12.5 6" stroke="currentColor" stroke-width="1.45" />
    </template>

    <!-- Close -->
    <template v-else-if="name === 'close'">
      <line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" stroke-width="1.5" />
      <line x1="12" y1="4" x2="4" y2="12" stroke="currentColor" stroke-width="1.5" />
    </template>

    <!-- Left Panel Toggle -->
    <template v-else-if="name === 'panel-left'">
      <rect x="1.5" y="2.5" width="13" height="11" stroke="currentColor" stroke-width="1.35" />
      <line x1="5.8" y1="2.5" x2="5.8" y2="13.5" stroke="currentColor" stroke-width="1.35" />
      <rect x="2.2" y="3.2" width="3" height="9.6" fill="currentColor" fill-opacity="0.4" />
    </template>

    <!-- Right Panel Toggle -->
    <template v-else-if="name === 'panel-right'">
      <rect x="1.5" y="2.5" width="13" height="11" stroke="currentColor" stroke-width="1.35" />
      <line x1="10.2" y1="2.5" x2="10.2" y2="13.5" stroke="currentColor" stroke-width="1.35" />
      <rect x="10.8" y="3.2" width="3" height="9.6" fill="currentColor" fill-opacity="0.4" />
    </template>

    <!-- Sun -->
    <template v-else-if="name === 'sun'">
      <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.45" />
      <line x1="8" y1="1.2" x2="8" y2="3" stroke="currentColor" stroke-width="1.45" />
      <line x1="8" y1="13" x2="8" y2="14.8" stroke="currentColor" stroke-width="1.45" />
      <line x1="1.2" y1="8" x2="3" y2="8" stroke="currentColor" stroke-width="1.45" />
      <line x1="13" y1="8" x2="14.8" y2="8" stroke="currentColor" stroke-width="1.45" />
      <line x1="3.2" y1="3.2" x2="4.5" y2="4.5" stroke="currentColor" stroke-width="1.45" />
      <line x1="11.5" y1="11.5" x2="12.8" y2="12.8" stroke="currentColor" stroke-width="1.45" />
      <line x1="12.8" y1="3.2" x2="11.5" y2="4.5" stroke="currentColor" stroke-width="1.45" />
      <line x1="4.5" y1="11.5" x2="3.2" y2="12.8" stroke="currentColor" stroke-width="1.45" />
    </template>

    <!-- Moon -->
    <template v-else-if="name === 'moon'">
      <path
        d="M12.6 9.8A5.2 5.2 0 0 1 6.2 3.4A5.5 5.5 0 1 0 12.6 9.8Z"
        stroke="currentColor"
        stroke-width="1.45"
      />
    </template>

    <!-- Comment -->
    <template v-else-if="name === 'comment'">
      <path d="M2 2.5H14V11H6.5L3 14V11H2V2.5Z" stroke="currentColor" stroke-width="1.35" />
      <line x1="5" y1="5.8" x2="11" y2="5.8" stroke="currentColor" stroke-width="1.25" />
      <line x1="5" y1="8.2" x2="9" y2="8.2" stroke="currentColor" stroke-width="1.25" />
    </template>

    <!-- Settings (Pure geometric circles & cardinal ticks) -->
    <template v-else-if="name === 'settings'">
      <circle cx="8" cy="8" r="2.4" stroke="currentColor" stroke-width="1.4" />
      <circle cx="8" cy="8" r="5.1" stroke="currentColor" stroke-width="1.35" stroke-dasharray="2.4 1.6" />
    </template>

    <!-- Expand All -->
    <template v-else-if="name === 'expand'">
      <path d="M4 6L8 2.5L12 6" stroke="currentColor" stroke-width="1.4" />
      <path d="M4 10L8 13.5L12 10" stroke="currentColor" stroke-width="1.4" />
    </template>

    <!-- Collapse All -->
    <template v-else-if="name === 'collapse'">
      <path d="M4 3L8 6.5L12 3" stroke="currentColor" stroke-width="1.4" />
      <path d="M4 13L8 9.5L12 13" stroke="currentColor" stroke-width="1.4" />
    </template>

    <!-- Arrow Left -->
    <template v-else-if="name === 'arrow-left'">
      <line x1="13" y1="8" x2="3.5" y2="8" stroke="currentColor" stroke-width="1.45" />
      <path d="M7.5 4L3.5 8L7.5 12" stroke="currentColor" stroke-width="1.45" />
    </template>

    <!-- Arrow Right -->
    <template v-else-if="name === 'arrow-right'">
      <line x1="3" y1="8" x2="12.5" y2="8" stroke="currentColor" stroke-width="1.45" />
      <path d="M8.5 4L12.5 8L8.5 12" stroke="currentColor" stroke-width="1.45" />
    </template>

    <!-- Reset -->
    <template v-else-if="name === 'reset'">
      <path d="M12.5 8A4.5 4.5 0 1 1 11.2 4.8" stroke="currentColor" stroke-width="1.4" />
      <path d="M11.5 2V5.2H8.3" stroke="currentColor" stroke-width="1.4" />
    </template>
  </svg>
</template>

<style scoped>
.icon-glyph {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
