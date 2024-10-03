export const createRandomNumber = () => {
    let num = '' 
    for(let i = 0; i < 6; i++) {
        num += Math.floor(Math.random() * 9);
    }
    return num
}