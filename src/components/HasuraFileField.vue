<template>
  <v-row no-gutters class="drag-and-drop-editor mb-2">
    <v-col cols="12" class="mb-0">
      <v-subheader :class="'subtitle-2 pl-0'" style="height: 30px;">
        {{ label }}
      </v-subheader>
    </v-col>
    <v-col v-if="!file && !disabled" cols="12" style="margin-top: -2px;">
      <dropzone-area
        :height="height"
        :accepted-files="acceptedFiles"
        :additional-params="params"
        @uploaded="onUploaded"/>
        <validation-message v-if="required" :value="(file || {}).id"/>
    </v-col>
    <v-col cols="12" style="margin-top: -14px;">
      <v-row v-if="file">
        <v-col cols="auto">
          <file-avatar :file="file" @remove="removeFile" :disabled="disabled"/>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>
<script>

import gql from 'graphql-tag';
import DropzoneArea from './DropzoneArea.vue';
import FileAvatar from './FileAvatar.vue';
import ValidationMessage from './ValidationMessage.vue';

export default {
  components: {
    DropzoneArea,
    FileAvatar,
    ValidationMessage,
  },
  props: {
    value: {
      type: String,
    },
    source: {
      type: String,
      default: 'File',
    },
    height: {
      type: Number,
      required: false,
      default: 100,
    },
    acceptedFiles: {
      type: String,
      required: false,
      default: '*',
    },
    label: {
      type: String,
      required: false,
      default: null,
    },
    required: {
      type: Boolean,
      default: false,
    },
    params: {
      type: Object,
      default: () => ({}),
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  apollo: {
    file: {
      query() {
        return gql`query GetFile ($id: uuid!) { 
          ${this.source} (where: { id: {_eq: $id} }, limit: 1 ) { 
            id name type created_at url
          } 
        }`;
      },
      update(data) {
        return data[this.source][0];
      },
      variables() {
        return { id: this.value };
      },
      skip() {
        return !this.value;
      },
    },
  },
  data() {
    return {
      file: null,
    };
  },
  methods: {
    onUploaded({ id }) {
      this.$emit('change', id);
      this.$emit('input', id);
    },
    async removeFile(file) {
      await this.$apollo.mutate({
        mutation: gql`mutation RemoveFile($id: uuid) {
          update_File(where: {id: {_eq: $id}}, _set: {isRemoved: true}) {
            affected_rows
          }
        }`,
        variables: {
          id: file.id,
        },
      });

      this.file = null;
      this.$emit('input', null);
    },
  },
};
</script>
<style>
 .drag-and-drop-editor .dz-preview,
 .drag-and-drop-editor .dz-processing,
 .drag-and-drop-editor .dz-image-preview,
 .drag-and-drop-editor .dz-success,
 .drag-and-drop-editor .dz-success {
   display: none;
 }

  .drag-and-drop-editor .v-card--reveal {
    width: 100%;
  }

  .file-card {
    cursor: pointer;
  }
</style>