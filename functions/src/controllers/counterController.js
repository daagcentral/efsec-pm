const admin = require('../db');
const firestore = admin.firestore()

const genNewPINumber = async () => {
    const shard_id = Math.floor(Math.random() * 4).toString();

    var count = await firestore.collection('proforma_counter').get().then(snapshot => {
        let total_count = 0;
        snapshot.forEach((doc) => {
            total_count += doc.data().count;
        });

        return total_count;
    })
    firestore.collection('proforma_counter').doc(shard_id).update(
        {"count": admin.firestore.FieldValue.increment(1)}
    )
    return count++
}

const genNewLetterNumber = async () => {
    const shard_id = Math.floor(Math.random() * 4).toString();

    var count = await firestore.collection('letter_counter').get().then(snapshot => {
        let total_count = 0;
        snapshot.forEach((doc) => {
            total_count += doc.data().count;
        });

        return total_count;
    })
    firestore.collection('letter_counter').doc(shard_id).update(
        {"count": admin.firestore.FieldValue.increment(1)}
    )
    return count++
}

module.exports = {
    genNewPINumber,
    genNewLetterNumber
}