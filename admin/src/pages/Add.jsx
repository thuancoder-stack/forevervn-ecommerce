import React, { useState } from 'react';
import { assets } from '../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl } from '../config';

const Add = ({ token }) => {
    const [image1, setImage1] = useState(false);
    const [image2, setImage2] = useState(false);
    const [image3, setImage3] = useState(false);
    const [image4, setImage4] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('Men');
    const [subCategory, setSubCategory] = useState('Topwear');
    const [bestseller, setBestseller] = useState(false);
    const [sizes, setSizes] = useState([]);

    const toggleSize = (size) => {
        setSizes((prev) =>
            prev.includes(size)
                ? prev.filter((s) => s !== size)
                : [...prev, size],
        );
    };

    const onSubmitHandler = async (e) => {
    e.preventDefault()

    try {
        const formData = new FormData()

        formData.append('name', name)
        formData.append('description', description)
        formData.append('price', price)
        formData.append('category', category)
        formData.append('subCategory', subCategory)
        formData.append('bestseller', bestseller)
        formData.append('sizes', JSON.stringify(sizes))

        image1 && formData.append('image1', image1)
        image2 && formData.append('image2', image2)
        image3 && formData.append('image3', image3)
        image4 && formData.append('image4', image4)

        const { data } = await axios.post(
            `${backendUrl}/api/product/add`,
            formData,
            { headers: { token } }
        )
       console.log(data);
        if (data.success) {
            toast.success(data.message)
            // reset form
            setName('')
            setDescription('')
            setPrice('')
            setImage1(null)
            setImage2(null)
            setImage3(null)
            setImage4(null)
            setSizes([])
        } else {
            toast.error(data.message)
        }

    } catch (error) {
        toast.error(error.message)
    }
}

    return (
        <form
            onSubmit={onSubmitHandler}
            className="flex flex-col w-full items-start gap-4 p-6"
        >
            {/* Upload Image */}
            <div>
                <p className="mb-2 font-medium">Upload Image</p>
                <div className="flex gap-2">
                    {[
                        { id: 'image1', img: image1, set: setImage1 },
                        { id: 'image2', img: image2, set: setImage2 },
                        { id: 'image3', img: image3, set: setImage3 },
                        { id: 'image4', img: image4, set: setImage4 },
                    ].map(({ id, img, set }) => (
                        <label key={id} htmlFor={id} className="cursor-pointer">
                            <img
                                className="w-12 h-12 object-cover border-2 border-dashed border-gray-300 rounded-md"
                                src={
                                    img
                                        ? URL.createObjectURL(img)
                                        : assets.upload_area
                                }
                                alt={id}
                            />
                            <input
                                onChange={(e) => set(e.target.files[0])}
                                type="file"
                                id={id}
                                hidden
                                accept="image/*"
                            />
                        </label>
                    ))}
                </div>
            </div>

            {/* Product Name */}
            <div className="w-full max-w-[500px]">
                <p className="mb-2 font-medium">Product Name</p>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-pink-400"
                    type="text"
                    placeholder="Enter product name"
                    required
                />
            </div>

            {/* Description */}
            <div className="w-full max-w-[500px]">
                <p className="mb-2 font-medium">Product Description</p>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-pink-400 resize-none"
                    rows={4}
                    placeholder="Write product description here"
                    required
                />
            </div>

            {/* Category, Sub-category, Price */}
            <div className="flex flex-wrap gap-4 w-full max-w-[500px]">
                <div className="flex-1 min-w-[120px]">
                    <p className="mb-2 font-medium">Category</p>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none"
                    >
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Kids">Kids</option>
                    </select>
                </div>

                <div className="flex-1 min-w-[120px]">
                    <p className="mb-2 font-medium">Sub Category</p>
                    <select
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none"
                    >
                        <option value="Topwear">Topwear</option>
                        <option value="Bottomwear">Bottomwear</option>
                        <option value="Winterwear">Winterwear</option>
                    </select>
                </div>

                <div className="flex-1 min-w-[120px]">
                    <p className="mb-2 font-medium">Price</p>
                    <input
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-pink-400"
                        type="number"
                        placeholder="250000"
                        min={0}
                        required
                    />
                </div>
            </div>

            {/* Sizes */}
            <div>
                <p className="mb-2 font-medium">Product Sizes</p>
                <div className="flex gap-2 flex-wrap">
                    {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                        <span
                            key={size}
                            onClick={() => toggleSize(size)}
                            className={`cursor-pointer px-4 py-1 rounded border text-sm font-medium transition-colors ${
                                sizes.includes(size)
                                    ? 'bg-pink-500 text-white border-pink-500'
                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:border-pink-400'
                            }`}
                        >
                            {size}
                        </span>
                    ))}
                </div>
            </div>

            {/* Bestseller */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="bestseller"
                    checked={bestseller}
                    onChange={(e) => setBestseller(e.target.checked)}
                    className="w-4 h-4 accent-pink-500"
                />
                <label
                    htmlFor="bestseller"
                    className="text-sm font-medium cursor-pointer"
                >
                    Add to Bestseller
                </label>
            </div>

            {/* Submit */}
            <button
                type="submit"
                className="bg-pink-500 hover:bg-pink-600 transition-colors text-white rounded px-8 py-2 text-sm font-medium shadow-sm"
            >
                ADD PRODUCT
            </button>
        </form>
    );
};

export default Add;
