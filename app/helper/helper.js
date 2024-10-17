// create date

export function createDate(date){
    let newDate = new Date(date);
    return `${newDate.getFullYear()}-${newDate.getMonth()}-${newDate.getDate()}`
}