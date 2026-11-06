

const PAD = (n) => String(n).padStart(2, '0')

function dayjs(date) {
  const d = date instanceof Date ? date : new Date(date)
  return {
    isValid() {
      return !isNaN(d.getTime())
    },
    format(tpl = 'YYYY-MM-DD HH:mm:ss') {
      if (isNaN(d.getTime())) return ''
      const map = {
        YYYY: d.getFullYear(),
        MM: PAD(d.getMonth() + 1),
        DD: PAD(d.getDate()),
        HH: PAD(d.getHours()),
        mm: PAD(d.getMinutes()),
        ss: PAD(d.getSeconds()),
      }
      return tpl.replace(/YYYY|MM|DD|HH|mm|ss/g, (k) => map[k])
    },
  }
}

export default dayjs
