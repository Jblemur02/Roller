<!-- SellCardModal.vue -->
<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-outer">
      <h2>Sell Card</h2>
      <div class="modal-inner">
        <div class="quantity-control">
          <button @click="incrementQuantity">▲</button>
          <div>
            <input
              class="quantity-input"
              type="text"
              v-model.number="quantityToSell"
              @input="validateQuantity"
            />
            <p class="card-quantity">Current Quantity: X{{ card.quantity }}</p>
          </div>
          <button @click="decrementQuantity">▼</button>
          <div class="actions">
            <button @click="confirmSell('all')">Sell All</button>
            <button @click="confirmSell(quantityToSell)">Sell Specified</button>
          </div>

          <div class="card-data">
            <p><strong>Price per Card:</strong> {{ card.value }}</p>
          </div>
        </div>
        <div
          class="card-display"
          :style="{
            color: card.color,
            boxShadow: card.aura,
            background:
              card.backgroundType === 'image'
                ? `url(${card.background}) no-repeat center center / cover`
                : card.background,
          }"
        >
          <img :src="card.image" alt="" class="card-image" />
          <div class="text">
            <h1 class="card-name" :style="{ fontFamily: card.font }">
              {{ card.name }}
            </h1>

            <h2 :style="{ fontFamily: card.font }">
              {{ card.type }}
            </h2>
          </div>
        </div>
      </div>

      <div v-if="confirmMessage" class="confirm">
        <p>Are you sure you want to sell {{ confirmQuantity }}?</p>
        <div class="confirm-buttons">
          <button @click="executeSell">Yes</button>
          <button @click="cancelSell">No</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    card: Object,
    closeModal: Function,
  },
  data() {
    return {
      quantityToSell: 1,
      confirmMessage: false,
      confirmQuantity: 0,
    }
  },
  methods: {
    incrementQuantity() {
      if (this.quantityToSell < this.card.quantity) {
        this.quantityToSell++
      }
    },
    decrementQuantity() {
      if (this.quantityToSell > 1) {
        this.quantityToSell--
      }
    },
    validateQuantity() {
      if (this.quantityToSell > this.card.quantity) {
        this.quantityToSell = this.card.quantity
      }
    },
    confirmSell(quantity) {
      if (quantity === 'all') {
        this.confirmQuantity = this.card.quantity
      } else {
        const quantityNum = parseInt(quantity, 10)
        if (isNaN(quantityNum) || quantityNum <= 0) {
          console.error('Invalid quantity specified:', quantity)
          return
        }
        this.confirmQuantity = quantityNum
      }
      this.confirmMessage = true
    },

    async executeSell() {
      if (this.confirmQuantity === this.card.quantity) {
        console.log(this.confirmQuantity)
        this.$emit('sell', this.confirmQuantity, { remove: true })
      } else {
        this.$emit('sell', this.confirmQuantity)
      }
      this.closeModal()
    },
    cancelSell() {
      this.confirmMessage = false
    },
  },
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-outer {
  background: var(--black);
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.modal-inner {
  text-align: center;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.modal-inner > div {
  width: 50%;
  height: 50vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.card-display {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.quantity-control {
  flex-direction: column;
  gap: 5%;
  padding: 5px;
}

.quantity-input {
  width: 100%;
  padding: 10px;
  text-align: center;
  border-radius: 5px;
}

.quantity-control input:focus {
  outline: none;
}

.quantity-control > button {
  height: 60px;
  width: 60px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  border: none;
  cursor: pointer;
  box-sizing: border-box;
  padding: 0;
}

.actions {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  gap: 5%;
}

.actions button {
  width: 20%;
}

img {
  box-sizing: border-box;
  width: 50%;
  height: auto;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: var(--shadow);
}

button {
  border-radius: 5px;
  padding: 5% 1%;
  width: 100%;
  border: none;
  background-color: var(--primary);
  color: var(--inverse);
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  box-shadow: var(--shadow);
}

.confirm {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
}

.confirm-buttons {
  display: flex;
}
</style>
