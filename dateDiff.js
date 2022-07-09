function dateDiffInDays(a, b) {
    // Discard the time and time-zone information.
    const diffInMs = (a - b);
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  }
module.exports = dateDiffInDays;