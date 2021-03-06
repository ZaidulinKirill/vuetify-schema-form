<script>
import { VAutocomplete, VCombobox } from 'vuetify/lib/components';
import gql from 'graphql-tag';
import equal from 'lodash.isequal';
import { createSlots } from '../utils';

export default {
  props: {
    value: {
      type: null,
    },
    query: {
      type: String,
      required: true,
    },
    onResponse: {
      type: Function,
      default: (item) => item,
    },
    onFetched: {
      type: Function,
      default: (items) => items,
    },
    debounceTimeout: {
      type: Number,
      default: 400,
    },
    filter: [Boolean, Object, Function],
    filterParamName: {
      type: String,
      default: 'where',
    },
    filterParamType: {
      type: String,
    },
    fetchAll: Boolean,
    combobox: Boolean,
  },
  data() {
    return {
      isLoading: false,
      items: [],
      search: null,
    };
  },
  watch: {
    value(val) {
      if (typeof val !== 'object') {
        this.search = val;
      }
    },
    query: {
      handler() {
        this.fetchItems();
      },
      immediate: true,
    },
    search() {
      this.fetchItems();
    },
  },
  methods: {
    emit(event, val) {
      this.$emit(event, val === undefined ? null : val);
    },
    getQueryString(queryName) {
      if (!this.filter) {
        return `query { ${this.query} }`;
      }

      return `query Search($query: ${this.filterParamType ? this.filterParamType : `${queryName}_bool_exp`}) { ${this.query.replace(queryName, `${queryName} (${this.filterParamName}: $query)`)} }`;
    },
    fetchItems() {
      const hasSearchParams = this.fetchAll || (this.search || '').length || !!this.value;
      if (this.filter && !hasSearchParams) {
        return;
      }

      if (!this.filter && this.items.length) {
        return;
      }

      // if (this.disableFetching) {
      //   this.disableFetching = false;
      //   return;
      // }

      this.isLoading = true;

      if (this.queryTimer) {
        clearTimeout(this.queryTimer);
      }

      this.queryTimer = setTimeout(async () => {
        const queryName = /[^{]*/.exec(this.query)[0].trim();
        const queryString = this.getQueryString(queryName);

        if (this.lastSmartQuery) {
          this.lastSmartQuery.stop();
        }

        this.lastSmartQuery = this.$apollo.addSmartQuery('items', {
          query: gql(queryString),
          variables: () => {
            this.currentFilter = this.filter && this.getFilter();
            return this.filter && {
              query: this.currentFilter,
            };
          },
          update: (data) => {
            if (data[queryName]) {
              this.isLoading = false;
              const items = this.onFetched(data[queryName].map(this.onResponse));

              this.$emit('fetched', items);

              return items;
            }
          },
        });

        this.queryTimer = null;
      }, this.debounceTimeout);
    },
    getFilter() {
      if (!this.filter) {
        return null;
      }

      const searchField = this.$attrs.itemText || 'text';
      const itemValue = this.$attrs.itemValue || 'value';

      // if (!!this.value && !(!!this.search && this.search.length)) {
      //   this.disableFetching = true;
      // }

      const filter = {
        _or: [
          !!this.value && { [itemValue]: { _eq: this.value } },
          !!this.search && this.search.length && { [searchField]: { _ilike: `%${this.search}%` } },
        ].filter((x) => !!x),
      };

      if (typeof this.filter === 'function') {
        return this.filter({
          filter, search: this.search, value: this.$attrs.value, ...this.$attrs.$options,
        });
      }

      if (typeof this.filter === 'object') {
        return this.filter;
      }

      return filter;
    },
  },
  render(createElement) {
    const newFilter = this.filter && (typeof this.filter === 'function' || typeof this.filter === 'object') && this.getFilter();
    if (newFilter && !equal(newFilter, this.currentFilter)) {
      this.currentFilter = newFilter;
      this.fetchItems();
    }

    return createElement(this.combobox ? VCombobox : VAutocomplete, {
      class: {
        'vdk-autocomplete-field': true,
      },
      props: {
        loaderHeight: 1,
        ...this.$attrs,
        items: this.items,
        loading: this.isLoading,
        filter: undefined,
        searchInput: this.search,
        // placeholder: this.$attrs.placeholder || (this.filter ? translate(this.$vuetify, 'enterToSearch', 'Enter query to search') : ''),
      },
      on: {
        ...this.$listeners,
        'update:search-input': (val) => {
          if (this.fetchAll) {
            return;
          }

          if (!val) {
            this.search = null;
          }
          if (typeof val === 'string') {
            this.search = val;
          }
        },
        input: (val) => {
          this.emit('input', typeof val === 'object' && !this.$attrs.multiple ? val[this.$attrs.itemValue || 'value'] : val);
        },
        change: (val) => {
          this.emit('change', typeof val === 'object' && !this.$attrs.multiple ? val[this.$attrs.itemValue || 'value'] : val);
        },
      },
    }, createSlots(createElement, this.$slots));
  },
};

</script>
<style>
.vdk-autocomplete-field.v-input--dense .v-select__slot {
  margin-top: -1px !important;
}
.vdk-autocomplete-field .v-input__slot {
  padding-bottom: 1px;
}
</style>
