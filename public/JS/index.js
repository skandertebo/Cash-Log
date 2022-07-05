let addCategoryBtn = document.getElementById("add-cat-btn");
addCategoryBtn.addEventListener("click", ()=>{
    let newCategory = document.createElement('div');
    newCategory.setAttribute("class" , "form-check mb-2");
    newCategory.setAttribute("style" , "display:flex; align-items:center; justify-content:flex-start;");
    newCategory.innerHTML = '<input type="radio" name="categorySelect" class="form-check-input" value=' + document.getElementById("add-cat").value + '> <label for="categorySelect" class="form-check-label mx-2">  ' + document.getElementById("add-cat").value + ' </label>';
    document.querySelector(".category-list").appendChild(newCategory);
    let newCategoryInOverview = document.createElement('li');
    newCategoryInOverview.setAttribute("class","list-group-item");
    newCategoryInOverview.setAttribute("style","background:none;");
    newCategoryInOverview.textContent = document.getElementById("add-cat").value; +" : 0TND"
    document.getElementById('category-list-overview').appendChild(newCategoryInOverview);
    document.getElementById("add-cat").value="";
})